import fs from "fs/promises";
import path from "path";
import { transcribeAudio } from "../openai/client";
import { 
  chunkAudioFile, 
  cleanupChunks, 
  mergeTranscriptions, 
  type AudioChunk,
  type ChunkingResult,
  AudioProcessingError 
} from "./chunking";
import { createClient } from "@supabase/supabase-js";

// Supabase client for downloading files
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface TranscriptionProgress {
  phase: "downloading" | "chunking" | "transcribing" | "merging" | "complete" | "error";
  message: string;
  progress: number; // 0-100
  chunksProcessed?: number;
  totalChunks?: number;
  currentChunk?: string;
}

export interface TranscriptionResult {
  text: string;
  duration: number;
  wordCount: number;
  confidence: number;
  metadata: {
    originalFileSize: number;
    chunksProcessed: number;
    processingTimeMs: number;
    apiCalls: number;
  };
}

export interface TranscriptionOptions {
  tempDir?: string;
  maxConcurrentChunks?: number;
  onProgress?: (progress: TranscriptionProgress) => void;
}

export class TranscriptionService {
  private tempDir: string;
  private maxConcurrentChunks: number;
  private onProgress?: (progress: TranscriptionProgress) => void;

  constructor(options: TranscriptionOptions = {}) {
    this.tempDir = options.tempDir || "/tmp/audiobook-processing";
    this.maxConcurrentChunks = options.maxConcurrentChunks || 3;
    this.onProgress = options.onProgress;
  }

  private async reportProgress(progress: TranscriptionProgress): Promise<void> {
    if (this.onProgress) {
      this.onProgress(progress);
    }
    console.log(`[${progress.phase.toUpperCase()}] ${progress.message} (${progress.progress}%)`);
  }

  // Download audio file from Supabase Storage
  private async downloadAudioFile(
    bucketName: string, 
    fileName: string, 
    localPath: string
  ): Promise<void> {
    try {
      await this.reportProgress({
        phase: "downloading",
        message: `Downloading ${fileName}...`,
        progress: 10,
      });

      // Clean the fileName - remove bucket name if it's included
      const cleanFileName = fileName.startsWith(`${bucketName}/`) 
        ? fileName.replace(`${bucketName}/`, '') 
        : fileName;

      console.log(`Downloading from bucket: ${bucketName}, file: ${cleanFileName}`);

      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(cleanFileName);

      if (error) {
        console.error('Supabase download error:', error);
        throw new Error(`Failed to download file from Supabase: ${error.message || JSON.stringify(error)}`);
      }

      if (!data) {
        throw new Error("No data received from Supabase Storage");
      }

      // Ensure directory exists
      await fs.mkdir(path.dirname(localPath), { recursive: true });

      // Write file to local path
      const buffer = Buffer.from(await data.arrayBuffer());
      await fs.writeFile(localPath, buffer);

      await this.reportProgress({
        phase: "downloading",
        message: `Downloaded ${cleanFileName} (${(buffer.length / (1024 * 1024)).toFixed(2)}MB)`,
        progress: 20,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Download failed:', errorMessage);
      throw new AudioProcessingError(`Failed to download audio file: ${errorMessage}`, error as Error);
    }
  }

  // Process multiple chunks concurrently with rate limiting
  private async processChunksConcurrently(
    chunks: AudioChunk[]
  ): Promise<{ chunkId: string; text: string; duration: number }[]> {
    const results: { chunkId: string; text: string; duration: number }[] = [];
    const totalChunks = chunks.length;
    let processed = 0;

    // Process chunks in batches to respect rate limits
    for (let i = 0; i < chunks.length; i += this.maxConcurrentChunks) {
      const batch = chunks.slice(i, i + this.maxConcurrentChunks);
      
      const batchPromises = batch.map(async (chunk) => {
        try {
          await this.reportProgress({
            phase: "transcribing",
            message: `Transcribing ${chunk.id}...`,
            progress: 30 + Math.floor((processed / totalChunks) * 60),
            chunksProcessed: processed,
            totalChunks,
            currentChunk: chunk.id,
          });

          const result = await transcribeAudio(chunk.filePath);
          processed++;

          await this.reportProgress({
            phase: "transcribing",
            message: `Completed ${chunk.id} (${result.text.length} characters)`,
            progress: 30 + Math.floor((processed / totalChunks) * 60),
            chunksProcessed: processed,
            totalChunks,
          });

          return {
            chunkId: chunk.id,
            text: result.text,
            duration: result.duration,
          };
        } catch (error) {
          console.error(`Failed to transcribe chunk ${chunk.id}:`, error);
          processed++;
          
          // Return empty result for failed chunks - we'll handle this gracefully
          return {
            chunkId: chunk.id,
            text: "",
            duration: 0,
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches to be respectful to the API
      if (i + this.maxConcurrentChunks < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  // Main transcription method
  async transcribeFromStorage(
    bucketName: string,
    fileName: string,
    audiobookId: string
  ): Promise<TranscriptionResult> {
    const startTime = Date.now();
    let chunkingResult: ChunkingResult | null = null;
    let apiCalls = 0;

    try {
      // Create unique temporary directory for this job
      const jobTempDir = path.join(this.tempDir, `job-${audiobookId}-${Date.now()}`);
      const originalFilePath = path.join(jobTempDir, "original_audio");
      const chunksDir = path.join(jobTempDir, "chunks");

      await fs.mkdir(jobTempDir, { recursive: true });

      // Step 1: Download file
      await this.downloadAudioFile(bucketName, fileName, originalFilePath);

      // Step 2: Analyze and chunk if necessary
      await this.reportProgress({
        phase: "chunking",
        message: "Analyzing audio file...",
        progress: 25,
      });

      chunkingResult = await chunkAudioFile(originalFilePath, chunksDir);
      
      if (chunkingResult.needsChunking) {
        await this.reportProgress({
          phase: "chunking",
          message: `Split into ${chunkingResult.totalChunks} chunks`,
          progress: 30,
        });
      } else {
        await this.reportProgress({
          phase: "chunking",
          message: "File is small enough, no chunking needed",
          progress: 30,
        });
      }

      // Step 3: Transcribe all chunks
      const transcriptionResults = await this.processChunksConcurrently(chunkingResult.chunks);
      apiCalls = transcriptionResults.length;

      // Step 4: Merge results
      await this.reportProgress({
        phase: "merging",
        message: "Merging transcription results...",
        progress: 90,
      });

      const mergedResult = mergeTranscriptions(chunkingResult.chunks, transcriptionResults);

      // Calculate confidence score (simplified)
      const successfulTranscriptions = transcriptionResults.filter(r => r.text.length > 0);
      const confidence = successfulTranscriptions.length / transcriptionResults.length;

      // Word count estimation (rough)
      const wordCount = mergedResult.fullText.split(/\s+/).filter(word => word.length > 0).length;

      const result: TranscriptionResult = {
        text: mergedResult.fullText,
        duration: mergedResult.totalDuration,
        wordCount,
        confidence,
        metadata: {
          originalFileSize: chunkingResult.metadata.sizeBytes,
          chunksProcessed: chunkingResult.totalChunks,
          processingTimeMs: Date.now() - startTime,
          apiCalls,
        },
      };

      await this.reportProgress({
        phase: "complete",
        message: `Transcription complete: ${wordCount} words, ${(result.confidence * 100).toFixed(1)}% confidence`,
        progress: 100,
      });

      // Cleanup temporary files
      await this.cleanup(jobTempDir, chunkingResult.chunks);

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      await this.reportProgress({
        phase: "error",
        message: `Transcription failed: ${errorMessage}`,
        progress: 0,
      });

      // Cleanup on error
      if (chunkingResult) {
        try {
          await this.cleanup(path.dirname(chunkingResult.chunks[0]?.filePath), chunkingResult.chunks);
        } catch (cleanupError) {
          console.warn("Failed to cleanup after error:", cleanupError);
        }
      }

      throw new AudioProcessingError(`Transcription failed: ${errorMessage}`, error as Error);
    }
  }

  // Cleanup temporary files
  private async cleanup(tempDir: string, chunks: AudioChunk[]): Promise<void> {
    try {
      // Clean up chunks
      await cleanupChunks(chunks);
      
      // Remove entire temporary directory
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log(`Cleaned up temporary directory: ${tempDir}`);
    } catch (error) {
      console.warn(`Failed to cleanup temporary directory ${tempDir}:`, error);
    }
  }

  // Get estimated processing time
  static estimateProcessingTime(fileSizeBytes: number): number {
    // Rough estimate: 1MB takes about 30-60 seconds to process
    const sizeMB = fileSizeBytes / (1024 * 1024);
    const estimateMinutes = Math.ceil(sizeMB * 0.75); // 45 seconds per MB
    return estimateMinutes;
  }

  // Get estimated cost
  static estimateCost(durationMinutes: number): number {
    // Whisper pricing: $0.006 per minute
    return durationMinutes * 0.006;
  }
}