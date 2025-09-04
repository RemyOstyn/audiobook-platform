import fs from "fs/promises";
import path from "path";
import { transcribeAudio } from "../openai/client";
import { 
  validateAudioFile,
  type AudioMetadata,
  AudioProcessingError 
} from "./chunking";
import { createClient } from "@supabase/supabase-js";

// Supabase client for downloading files
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface TranscriptionProgress {
  phase: "downloading" | "validating" | "transcribing" | "complete" | "error";
  message: string;
  progress: number; // 0-100
}

export interface TranscriptionResult {
  text: string;
  duration: number;
  wordCount: number;
  confidence: number;
  metadata: {
    originalFileSize: number;
    processingTimeMs: number;
  };
}

export interface TranscriptionOptions {
  tempDir?: string;
  onProgress?: (progress: TranscriptionProgress) => void;
}

export class TranscriptionService {
  private tempDir: string;
  private onProgress?: (progress: TranscriptionProgress) => void;

  constructor(options: TranscriptionOptions = {}) {
    this.tempDir = options.tempDir || "/tmp/audiobook-processing";
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

  // Simple transcription for single file under 25MB
  private async transcribeSingleFile(filePath: string): Promise<{ text: string; duration: number }> {
    await this.reportProgress({
      phase: "transcribing",
      message: "Transcribing audio file...",
      progress: 50,
    });

    const result = await transcribeAudio(filePath);

    await this.reportProgress({
      phase: "transcribing",
      message: `Transcription complete (${result.text.length} characters)`,
      progress: 90,
    });

    return result;
  }

  // Main transcription method
  async transcribeFromStorage(
    bucketName: string,
    fileName: string,
    audiobookId: string
  ): Promise<TranscriptionResult> {
    const startTime = Date.now();
    let metadata: AudioMetadata | null = null;

    try {
      // Create unique temporary directory for this job
      const jobTempDir = path.join(this.tempDir, `job-${audiobookId}-${Date.now()}`);
      const originalFilePath = path.join(jobTempDir, "original_audio");

      await fs.mkdir(jobTempDir, { recursive: true });

      // Step 1: Download file
      await this.downloadAudioFile(bucketName, fileName, originalFilePath);

      // Step 2: Validate file size and get metadata
      await this.reportProgress({
        phase: "validating",
        message: "Validating audio file...",
        progress: 25,
      });

      metadata = await validateAudioFile(originalFilePath);

      await this.reportProgress({
        phase: "validating",
        message: `File validated: ${(metadata.sizeBytes / (1024 * 1024)).toFixed(2)}MB ${metadata.format}`,
        progress: 30,
      });

      // Step 3: Transcribe the single file
      const transcriptionResult = await this.transcribeSingleFile(originalFilePath);

      // Word count estimation
      const wordCount = transcriptionResult.text.split(/\s+/).filter(word => word.length > 0).length;

      const result: TranscriptionResult = {
        text: transcriptionResult.text,
        duration: transcriptionResult.duration,
        wordCount,
        confidence: 1.0, // Single file, assume high confidence
        metadata: {
          originalFileSize: metadata.sizeBytes,
          processingTimeMs: Date.now() - startTime,
        },
      };

      await this.reportProgress({
        phase: "complete",
        message: `Transcription complete: ${wordCount} words`,
        progress: 100,
      });

      // Cleanup temporary files
      await this.cleanup(jobTempDir);

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      await this.reportProgress({
        phase: "error",
        message: `Transcription failed: ${errorMessage}`,
        progress: 0,
      });

      // Cleanup on error
      try {
        const jobTempDir = path.join(this.tempDir, `job-${audiobookId}-${Date.now()}`);
        await this.cleanup(jobTempDir);
      } catch (cleanupError) {
        console.warn("Failed to cleanup after error:", cleanupError);
      }

      throw new AudioProcessingError(`Transcription failed: ${errorMessage}`, error as Error);
    }
  }

  // Cleanup temporary files
  private async cleanup(tempDir: string): Promise<void> {
    try {
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