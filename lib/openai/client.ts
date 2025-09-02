import OpenAI from "openai";
import fs from "fs";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required");
}

// Create OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuration constants
export const OPENAI_CONFIG = {
  WHISPER_MODEL: "whisper-1",
  GPT4_MODEL: "gpt-4o-mini", // Using more cost-effective model for content generation
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || "500"),
  CHUNK_SIZE_MB: parseInt(process.env.CHUNK_SIZE_MB || "20"),
  MAX_RETRIES: parseInt(process.env.MAX_RETRY_ATTEMPTS || "3"),
} as const;

// Error types for better error handling
export class OpenAIAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
  ) {
    super(message);
    this.name = "OpenAIAPIError";
  }
}

export class QuotaExceededError extends OpenAIAPIError {
  constructor(message: string) {
    super(message, 429, "quota_exceeded");
    this.name = "QuotaExceededError";
  }
}

export class RateLimitError extends OpenAIAPIError {
  constructor(message: string) {
    super(message, 429, "rate_limit_exceeded");
    this.name = "RateLimitError";
  }
}

// Retry logic with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = OPENAI_CONFIG.MAX_RETRIES,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if it's a rate limit or quota error
      if (error instanceof OpenAI.APIError) {
        if (error.status === 429) {
          const isQuotaExceeded = error.message?.toLowerCase().includes("quota");
          if (isQuotaExceeded) {
            throw new QuotaExceededError(error.message);
          } else {
            throw new RateLimitError(error.message);
          }
        }

        // Don't retry on client errors (4xx except rate limit)
        if (error.status && error.status >= 400 && error.status < 500) {
          throw new OpenAIAPIError(error.message, error.status, error.code || undefined);
        }
      }

      // If not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`OpenAI API attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

// Transcribe audio file using Whisper
export async function transcribeAudio(filePath: string): Promise<{
  text: string;
  duration: number;
}> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Audio file not found: ${filePath}`);
  }

  const stats = fs.statSync(filePath);
  const fileSizeMB = stats.size / (1024 * 1024);
  
  // Check file size limit
  if (fileSizeMB > 25) {
    throw new Error(
      `File size ${fileSizeMB.toFixed(2)}MB exceeds Whisper API limit of 25MB. File needs to be chunked first.`
    );
  }

  return withRetry(async () => {
    console.log(`Transcribing audio file: ${filePath} (${fileSizeMB.toFixed(2)}MB)`);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: OPENAI_CONFIG.WHISPER_MODEL,
      response_format: "verbose_json",
    });

    return {
      text: transcription.text,
      duration: transcription.duration || 0,
    };
  });
}

// Generate content using GPT-4
export async function generateContent(
  transcriptionText: string,
  customPrompt?: string
): Promise<{
  description: string;
  categories: string[];
  summary: string;
}> {
  const prompt = customPrompt || `
You are a professional book marketing expert. Based on the following audiobook transcription, generate:

1. A compelling 500-1000 word description suitable for marketing
2. Up to 3 relevant categories/genres 
3. A brief 2-3 sentence summary

Transcription excerpt (first 3000 characters):
${transcriptionText.slice(0, 3000)}${transcriptionText.length > 3000 ? "..." : ""}

Please respond in the following JSON format:
{
  "description": "A compelling marketing description...",
  "categories": ["Category1", "Category2", "Category3"],
  "summary": "Brief summary..."
}
`;

  return withRetry(async () => {
    console.log("Generating content with GPT-4...");

    const completion = await openai.chat.completions.create({
      model: OPENAI_CONFIG.GPT4_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a professional book marketing expert. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error("No response from GPT-4");
    }

    try {
      const parsedResponse = JSON.parse(responseText);
      
      // Validate response structure
      if (!parsedResponse.description || !parsedResponse.categories || !parsedResponse.summary) {
        throw new Error("Invalid response structure from GPT-4");
      }

      return {
        description: parsedResponse.description,
        categories: Array.isArray(parsedResponse.categories) 
          ? parsedResponse.categories.slice(0, 3) 
          : [],
        summary: parsedResponse.summary,
      };
    } catch {
      console.error("Failed to parse GPT-4 response:", responseText);
      throw new Error("Invalid JSON response from GPT-4");
    }
  });
}