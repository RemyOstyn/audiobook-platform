import ffmpeg from "fluent-ffmpeg";
import fs from "fs/promises";
import path from "path";

// Type definitions for FFmpeg metadata
interface AudioStream {
  codec_type: string;
  duration?: string;
  bit_rate?: string;
  channels?: number;
  sample_rate?: number;
  [key: string]: unknown;
}

interface FFmpegMetadata {
  streams: AudioStream[];
  format: {
    duration?: string;
    size?: string;
    format_name?: string;
    bit_rate?: string;
    [key: string]: unknown;
  };
}

// Configuration constants
const CHUNK_SIZE_MB = parseInt(process.env.CHUNK_SIZE_MB || "20");
const CHUNK_OVERLAP_SECONDS = parseInt(process.env.CHUNK_OVERLAP_SECONDS || "5");
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || "500");

export interface AudioChunk {
  id: string;
  filePath: string;
  startTime: number;
  endTime: number;
  duration: number;
  sizeBytes: number;
  overlapStart: number;
  overlapEnd: number;
}

export interface AudioMetadata {
  duration: number;
  sizeBytes: number;
  format: string;
  bitrate?: number;
  channels?: number;
  sampleRate?: number;
}

export interface ChunkingResult {
  chunks: AudioChunk[];
  metadata: AudioMetadata;
  totalChunks: number;
  needsChunking: boolean;
}

// Custom error classes
export class AudioProcessingError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = "AudioProcessingError";
  }
}

export class FileNotFoundError extends AudioProcessingError {
  constructor(filePath: string) {
    super(`Audio file not found: ${filePath}`);
    this.name = "FileNotFoundError";
  }
}

export class FileTooLargeError extends AudioProcessingError {
  constructor(sizeMB: number) {
    super(`File size ${sizeMB.toFixed(2)}MB exceeds maximum limit of ${MAX_FILE_SIZE_MB}MB`);
    this.name = "FileTooLargeError";
  }
}

// Analyze audio file metadata
export async function analyzeAudioFile(filePath: string): Promise<AudioMetadata> {
  try {
    const stats = await fs.stat(filePath);
    const sizeBytes = stats.size;
    const sizeMB = sizeBytes / (1024 * 1024);

    if (sizeMB > MAX_FILE_SIZE_MB) {
      throw new FileTooLargeError(sizeMB);
    }

    // Use ffprobe to get audio metadata
    const metadata = await new Promise<FFmpegMetadata>((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(new AudioProcessingError("Failed to analyze audio file", err));
        } else {
          resolve(metadata as unknown as FFmpegMetadata);
        }
      });
    });

    const audioStream = metadata.streams.find((stream: AudioStream) => stream.codec_type === "audio");
    if (!audioStream) {
      throw new AudioProcessingError("No audio stream found in file");
    }

    return {
      duration: metadata.format.duration ? parseFloat(metadata.format.duration) : 0,
      sizeBytes,
      format: metadata.format.format_name || 'unknown',
      bitrate: metadata.format.bit_rate ? parseInt(metadata.format.bit_rate) : undefined,
      channels: audioStream.channels || undefined,
      sampleRate: audioStream.sample_rate || undefined,
    };
  } catch (error) {
    if (error instanceof AudioProcessingError) {
      throw error;
    }
    
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new FileNotFoundError(filePath);
    }

    throw new AudioProcessingError("Failed to analyze audio file", error as Error);
  }
}

// Calculate optimal chunk strategy
function calculateChunkStrategy(metadata: AudioMetadata): {
  needsChunking: boolean;
  chunkDuration: number;
  totalChunks: number;
} {
  const sizeMB = metadata.sizeBytes / (1024 * 1024);
  const needsChunking = sizeMB > 25; // Whisper API limit

  if (!needsChunking) {
    return {
      needsChunking: false,
      chunkDuration: metadata.duration,
      totalChunks: 1,
    };
  }

  // Calculate chunk duration based on file size and target chunk size
  const targetChunkSizeMB = Math.min(CHUNK_SIZE_MB, 24); // Stay under 25MB limit
  const chunkDuration = (metadata.duration * targetChunkSizeMB) / sizeMB;
  const totalChunks = Math.ceil(metadata.duration / chunkDuration);

  return {
    needsChunking: true,
    chunkDuration,
    totalChunks,
  };
}

// Create a single audio chunk
async function createChunk(
  inputPath: string,
  outputPath: string,
  startTime: number,
  duration: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .seekInput(startTime)
      .duration(duration)
      .audioCodec("copy") // Copy audio without re-encoding when possible
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(new AudioProcessingError("Failed to create audio chunk", err)))
      .run();
  });
}

// Main chunking function
export async function chunkAudioFile(
  inputFilePath: string,
  outputDirectory: string,
): Promise<ChunkingResult> {
  try {
    // Analyze the input file
    const metadata = await analyzeAudioFile(inputFilePath);
    const strategy = calculateChunkStrategy(metadata);

    // Create output directory if it doesn't exist
    await fs.mkdir(outputDirectory, { recursive: true });

    if (!strategy.needsChunking) {
      // File is small enough, return as single chunk
      const chunkId = "chunk_000";
      const outputPath = path.join(outputDirectory, `${chunkId}.mp3`);
      
      // Copy the original file
      await fs.copyFile(inputFilePath, outputPath);
      const stats = await fs.stat(outputPath);

      const chunk: AudioChunk = {
        id: chunkId,
        filePath: outputPath,
        startTime: 0,
        endTime: metadata.duration,
        duration: metadata.duration,
        sizeBytes: stats.size,
        overlapStart: 0,
        overlapEnd: 0,
      };

      return {
        chunks: [chunk],
        metadata,
        totalChunks: 1,
        needsChunking: false,
      };
    }

    // Create chunks for large files
    const chunks: AudioChunk[] = [];
    const { chunkDuration, totalChunks } = strategy;

    console.log(`Chunking audio file into ${totalChunks} chunks of ~${chunkDuration.toFixed(1)}s each`);

    for (let i = 0; i < totalChunks; i++) {
      const chunkId = `chunk_${i.toString().padStart(3, "0")}`;
      const outputPath = path.join(outputDirectory, `${chunkId}.mp3`);

      // Calculate chunk timing with overlap
      const startTime = Math.max(0, i * chunkDuration - (i > 0 ? CHUNK_OVERLAP_SECONDS : 0));
      const endTime = Math.min(metadata.duration, (i + 1) * chunkDuration + CHUNK_OVERLAP_SECONDS);
      const actualDuration = endTime - startTime;

      // Create the chunk
      await createChunk(inputFilePath, outputPath, startTime, actualDuration);

      // Get the actual file size
      const stats = await fs.stat(outputPath);

      const chunk: AudioChunk = {
        id: chunkId,
        filePath: outputPath,
        startTime,
        endTime,
        duration: actualDuration,
        sizeBytes: stats.size,
        overlapStart: i > 0 ? CHUNK_OVERLAP_SECONDS : 0,
        overlapEnd: i < totalChunks - 1 ? CHUNK_OVERLAP_SECONDS : 0,
      };

      chunks.push(chunk);
      console.log(`Created chunk ${i + 1}/${totalChunks}: ${chunkId} (${(stats.size / (1024 * 1024)).toFixed(2)}MB)`);
    }

    return {
      chunks,
      metadata,
      totalChunks,
      needsChunking: true,
    };
  } catch (error) {
    if (error instanceof AudioProcessingError) {
      throw error;
    }
    throw new AudioProcessingError("Failed to chunk audio file", error as Error);
  }
}

// Clean up temporary chunk files
export async function cleanupChunks(chunks: AudioChunk[]): Promise<void> {
  const deletePromises = chunks.map(async (chunk) => {
    try {
      await fs.unlink(chunk.filePath);
      console.log(`Cleaned up chunk: ${chunk.id}`);
    } catch (error) {
      console.warn(`Failed to delete chunk ${chunk.id}: ${error}`);
    }
  });

  await Promise.all(deletePromises);
}

// Merge transcription results from multiple chunks
export function mergeTranscriptions(
  chunks: AudioChunk[],
  transcriptions: { chunkId: string; text: string; duration: number }[],
): { fullText: string; totalDuration: number } {
  // Sort chunks by start time to ensure correct order
  const sortedChunks = [...chunks].sort((a, b) => a.startTime - b.startTime);
  
  const sortedTranscriptions = sortedChunks.map((chunk) => {
    const transcription = transcriptions.find((t) => t.chunkId === chunk.id);
    return transcription || { chunkId: chunk.id, text: "", duration: 0 };
  });

  // Simple approach: concatenate all text with paragraph breaks
  // In a more sophisticated implementation, you'd handle overlap removal
  const fullText = sortedTranscriptions
    .filter((t) => t.text.trim())
    .map((t) => t.text.trim())
    .join("\n\n");

  const totalDuration = Math.max(...sortedChunks.map((c) => c.endTime));

  return {
    fullText,
    totalDuration,
  };
}