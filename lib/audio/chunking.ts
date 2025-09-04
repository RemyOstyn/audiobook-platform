import fs from "fs/promises";
import path from "path";

// Configuration constants
const MAX_FILE_SIZE_MB = 25; // OpenAI Whisper API limit

export interface AudioMetadata {
  sizeBytes: number;
  format: string;
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
    super(`File size ${sizeMB.toFixed(2)}MB exceeds maximum limit of ${MAX_FILE_SIZE_MB}MB. Please compress your audio file or use a shorter audio segment.`);
    this.name = "FileTooLargeError";
  }
}

// Analyze audio file basic metadata
export async function analyzeAudioFile(filePath: string): Promise<AudioMetadata> {
  try {
    const stats = await fs.stat(filePath);
    const sizeBytes = stats.size;
    const sizeMB = sizeBytes / (1024 * 1024);

    if (sizeMB > MAX_FILE_SIZE_MB) {
      throw new FileTooLargeError(sizeMB);
    }

    // Get format from file extension
    const ext = path.extname(filePath).toLowerCase();
    const formatMap: { [key: string]: string } = {
      '.mp3': 'mp3',
      '.m4a': 'm4a', 
      '.m4b': 'm4b',
      '.aac': 'aac',
      '.wav': 'wav',
      '.flac': 'flac'
    };

    return {
      sizeBytes,
      format: formatMap[ext] || 'unknown',
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

// Simple validation for audio files under 25MB
export function validateAudioFile(filePath: string): Promise<AudioMetadata> {
  return analyzeAudioFile(filePath);
}