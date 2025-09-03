import { inngest } from "../client";
import { TranscriptionService } from "../../audio/transcription";
import { ContentGenerationService } from "../../ai/content-generation";
import { PrismaClient, JobStatus } from "@prisma/client";

const prisma = new PrismaClient();

// Use Prisma-generated JobStatus enum directly - no need for custom enum

// Processing function that handles the entire audiobook pipeline
export const processAudiobook = inngest.createFunction(
  {
    id: "process-audiobook",
    name: "Process Audiobook",
    retries: 3,
  },
  { event: "audiobook/uploaded" },
  async ({ event, step }) => {
    const { audiobookId, fileName, fileSize, filePath } = event.data;

    console.log(`Starting processing for audiobook ${audiobookId}: ${fileName}`);

    // Step 1: Initialize processing job
    const processingJob = await step.run("create-processing-job", async () => {
      return await prisma.processingJob.create({
        data: {
          audiobook_id: audiobookId,
          job_type: "transcription",
          status: JobStatus.pending,
          progress: 0,
          metadata: {
            fileName,
            fileSize,
            filePath,
            startTime: new Date().toISOString(),
          },
        },
      });
    });

    try {
      // Step 2: Get audiobook details
      const audiobook = await step.run("fetch-audiobook", async () => {
        const book = await prisma.audiobook.findUnique({
          where: { id: audiobookId },
        });

        if (!book) {
          throw new Error(`Audiobook not found: ${audiobookId}`);
        }

        return book;
      });

      // Step 3: Update status to downloading
      await step.run("update-status-downloading", async () => {
        await updateJobStatus(processingJob.id, JobStatus.downloading, 5, {
          phase: "downloading",
          message: "Starting download from storage...",
        });
      });

      // Step 4: Transcribe audio file
      const transcriptionResult = await step.run("transcribe-audio", async () => {
        const transcriptionService = new TranscriptionService({
          onProgress: async (progress) => {
            // Update job progress with specific status based on phase
            const adjustedProgress = Math.floor(5 + (progress.progress * 0.6)); // Maps 0-100 to 5-65
            
            let status: JobStatus;
            switch(progress.phase) {
              case 'downloading': 
                status = JobStatus.downloading; 
                break;
              case 'chunking': 
                status = JobStatus.chunking; 
                break;
              case 'transcribing': 
                status = JobStatus.transcribing; 
                break;
              default: 
                status = JobStatus.processing;
            }

            await updateJobStatus(processingJob.id, status, adjustedProgress, {
              phase: progress.phase,
              message: progress.message,
              chunksProcessed: progress.chunksProcessed,
              totalChunks: progress.totalChunks,
              currentChunk: progress.currentChunk,
            });
          },
        });

        // Extract bucket name and file path from the storage URL
        const bucketName = "audiobooks"; // Assuming this is your bucket name
        // Use the full filePath which contains the correct path structure
        const actualFileName = filePath; // This contains either "audiobooks/filename.mp3" or just "filename.mp3"

        return await transcriptionService.transcribeFromStorage(
          bucketName,
          actualFileName,
          audiobookId
        );
      });

      // Step 5: Save transcription to database
      const transcriptionRecord = await step.run("save-transcription", async () => {
        await updateJobStatus(processingJob.id, JobStatus.processing, 70, {
          phase: "saving",
          message: "Saving transcription to database...",
        });

        return await prisma.transcription.create({
          data: {
            audiobook_id: audiobookId,
            full_text: transcriptionResult.text,
            word_count: transcriptionResult.wordCount,
            confidence_score: transcriptionResult.confidence,
            processing_time_ms: transcriptionResult.metadata.processingTimeMs,
          },
        });
      });

      // Step 6: Generate AI content
      const aiContent = await step.run("generate-ai-content", async () => {
        await updateJobStatus(processingJob.id, JobStatus.generating_content, 75, {
          phase: "generating_content",
          message: "Generating description and categories with AI...",
        });

        return await ContentGenerationService.generateFromTranscription(
          transcriptionResult,
          audiobook.title,
          audiobook.author
        );
      });

      // Step 7: Update audiobook with generated content
      await step.run("update-audiobook-content", async () => {
        await updateJobStatus(processingJob.id, JobStatus.processing, 90, {
          phase: "updating",
          message: "Updating audiobook with generated content...",
        });

        await prisma.audiobook.update({
          where: { id: audiobookId },
          data: {
            description: aiContent.description,
            ai_summary: aiContent.summary,
            categories: aiContent.categories,
            status: "active", // Mark as active after processing
            updated_at: new Date(),
          },
        });
      });

      // Step 8: Complete processing job
      await step.run("complete-processing", async () => {
        const endTime = new Date();
        const startTime = new Date(processingJob.created_at);
        const totalTimeMs = endTime.getTime() - startTime.getTime();

        await prisma.processingJob.update({
          where: { id: processingJob.id },
          data: {
            status: JobStatus.completed,
            progress: 100,
            completed_at: endTime,
            metadata: {
              ...(typeof processingJob.metadata === 'object' && processingJob.metadata !== null ? processingJob.metadata as Record<string, unknown> : {}),
              endTime: endTime.toISOString(),
              totalTimeMs,
              transcriptionId: transcriptionRecord.id,
              wordCount: transcriptionResult.wordCount,
              confidence: transcriptionResult.confidence,
              categoriesGenerated: aiContent.categories,
            },
          },
        });

        console.log(`Audiobook processing completed for ${audiobookId} in ${totalTimeMs}ms`);
      });

      // Step 9: Send completion event
      await step.sendEvent("send-completion-event", {
        name: "audiobook/processing-complete",
        data: {
          audiobookId,
          success: true,
          transcriptionId: transcriptionRecord.id,
          processingTimeMs: transcriptionResult.metadata.processingTimeMs,
        },
      });

      return {
        success: true,
        audiobookId,
        transcriptionId: transcriptionRecord.id,
        wordCount: transcriptionResult.wordCount,
        confidence: transcriptionResult.confidence,
        categories: aiContent.categories,
        processingTimeMs: transcriptionResult.metadata.processingTimeMs,
      };

    } catch (error) {
      console.error(`Processing failed for audiobook ${audiobookId}:`, error);

      // Update job as failed
      await step.run("mark-job-failed", async () => {
        await prisma.processingJob.update({
          where: { id: processingJob.id },
          data: {
            status: JobStatus.failed,
            progress: 0,
            error_message: error instanceof Error ? error.message : "Unknown error",
            completed_at: new Date(),
          },
        });

        // Keep audiobook in processing state for manual intervention
        await prisma.audiobook.update({
          where: { id: audiobookId },
          data: {
            status: "processing", // Keep in processing state for admin review
          },
        });
      });

      // Send failure event
      await step.sendEvent("send-failure-event", {
        name: "audiobook/processing-complete",
        data: {
          audiobookId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });

      throw error;
    }
  }
);

// Helper function to update job status
async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  progress: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const currentJob = await prisma.processingJob.findUnique({
      where: { id: jobId },
    });

    if (!currentJob) {
      console.warn(`Processing job not found: ${jobId}`);
      return;
    }

    await prisma.processingJob.update({
      where: { id: jobId },
      data: {
        status,
        progress: Math.max(0, Math.min(100, progress)), // Ensure 0-100 range
        metadata: {
          ...(typeof currentJob.metadata === 'object' && currentJob.metadata !== null ? currentJob.metadata as Record<string, unknown> : {}),
          ...metadata,
          lastUpdated: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error(`Failed to update job status for ${jobId}:`, error);
    // Don't throw - status updates shouldn't fail the main process
  }
}

// Additional helper function for retry logic
export const retryFailedJob = inngest.createFunction(
  {
    id: "retry-failed-audiobook-job",
    name: "Retry Failed Audiobook Processing",
  },
  { event: "audiobook/retry-processing" },
  async ({ event }) => {
    const { audiobookId } = event.data;

    // Get the audiobook details
    const audiobook = await prisma.audiobook.findUnique({
      where: { id: audiobookId },
    });

    if (!audiobook) {
      throw new Error(`Audiobook not found: ${audiobookId}`);
    }

    // Extract file information from file_url
    // file_url format: https://[project].supabase.co/storage/v1/object/public/audiobooks/audiobooks/uniqueFileName.mp3
    const urlParts = audiobook.file_url.split('/');
    const fileName = urlParts[urlParts.length - 1]; // Last part is the filename
    
    // For existing files, extract the full path after /object/public/audiobooks/
    const bucketIndex = audiobook.file_url.indexOf('/object/public/audiobooks/');
    const filePath = bucketIndex !== -1 
      ? audiobook.file_url.substring(bucketIndex + '/object/public/audiobooks/'.length)
      : fileName; // Fallback to just filename for new uploads

    // Trigger the main processing function again
    await inngest.send({
      name: "audiobook/uploaded",
      data: {
        audiobookId,
        fileName: fileName,
        fileSize: Number(audiobook.file_size_bytes || 0),
        filePath: filePath,
      },
    });

    return { success: true, retriggered: true };
  }
);

export default processAudiobook;