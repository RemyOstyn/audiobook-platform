import { generateContent as baseGenerateContent, OpenAIAPIError } from "../openai/client";
import type { TranscriptionResult } from "../audio/transcription";

export interface ContentGenerationResult {
  description: string;
  summary: string;
  categories: string[];
  keywords: string[];
  metadata: {
    contentLength: number;
    processingTimeMs: number;
    confidence: number;
  };
}

export interface ContentGenerationOptions {
  includeKeywords?: boolean;
  maxDescriptionWords?: number;
  targetCategories?: string[];
  tone?: "professional" | "casual" | "academic" | "marketing";
}

export class ContentGenerationService {
  private static readonly DEFAULT_OPTIONS: Required<ContentGenerationOptions> = {
    includeKeywords: true,
    maxDescriptionWords: 800,
    targetCategories: [],
    tone: "marketing",
  };

  // Enhanced content generation with more sophisticated prompts
  static async generateFromTranscription(
    transcription: TranscriptionResult,
    bookTitle?: string,
    author?: string,
    options: ContentGenerationOptions = {}
  ): Promise<ContentGenerationResult> {
    const startTime = Date.now();
    const config = { ...this.DEFAULT_OPTIONS, ...options };

    try {
      console.log("Starting enhanced content generation...");

      // Prepare context information
      const contextInfo = this.prepareContextInfo(transcription, bookTitle, author);
      
      // Generate main content
      const mainContent = await this.generateMainContent(
        transcription.text, 
        contextInfo, 
        config
      );

      // Generate keywords if requested
      let keywords: string[] = [];
      if (config.includeKeywords) {
        keywords = await this.generateKeywords(transcription.text, mainContent.categories);
      }

      const processingTime = Date.now() - startTime;

      return {
        description: mainContent.description,
        summary: mainContent.summary,
        categories: mainContent.categories,
        keywords,
        metadata: {
          contentLength: mainContent.description.length,
          processingTimeMs: processingTime,
          confidence: this.calculateConfidence(mainContent, transcription),
        },
      };
    } catch (error) {
      console.error("Content generation failed:", error);
      throw new OpenAIAPIError(
        `Content generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        undefined,
        "content_generation_failed"
      );
    }
  }

  // Prepare context information for better prompts
  private static prepareContextInfo(
    transcription: TranscriptionResult,
    bookTitle?: string,
    author?: string
  ): string {
    const info: string[] = [];
    
    if (bookTitle) info.push(`Title: "${bookTitle}"`);
    if (author) info.push(`Author: ${author}`);
    
    info.push(`Duration: ${Math.round(transcription.duration / 60)} minutes`);
    info.push(`Word count: ${transcription.wordCount.toLocaleString()} words`);
    info.push(`Transcription confidence: ${(transcription.confidence * 100).toFixed(1)}%`);

    return info.length > 0 ? info.join(" | ") : "No additional context provided";
  }

  // Generate main content with sophisticated prompting
  private static async generateMainContent(
    transcriptionText: string,
    contextInfo: string,
    options: Required<ContentGenerationOptions>
  ): Promise<{ description: string; summary: string; categories: string[] }> {
    // Use a more sophisticated excerpt strategy
    const excerpt = this.createSmartExcerpt(transcriptionText, 4000);
    
    const toneInstructions = this.getToneInstructions(options.tone);
    const categoryGuidance = this.getCategoryGuidance(options.targetCategories);

    const prompt = `
You are an expert book marketing consultant and literary analyst. Your task is to create compelling marketing content for an audiobook based on its transcription.

CONTEXT INFORMATION:
${contextInfo}

CONTENT REQUIREMENTS:
- Description: ${options.maxDescriptionWords} words maximum, ${toneInstructions}
- Summary: 2-3 compelling sentences that hook potential listeners
- Categories: Up to 3 most relevant genres/categories ${categoryGuidance}

TRANSCRIPTION EXCERPT:
${excerpt}

Please analyze the content thoroughly and provide:

1. A compelling marketing description that:
   - Highlights the main themes and key insights
   - Uses engaging language that appeals to the target audience
   - Includes specific details that make the content unique
   - Avoids generic language and clichés
   - Maintains the appropriate ${options.tone} tone

2. A powerful summary that:
   - Captures the essence in 2-3 sentences
   - Creates curiosity and urgency
   - Highlights the key value proposition

3. Precise categories that:
   - Reflect the actual content accurately
   - Use standard genre classifications
   - Are specific enough to help with discoverability

Respond in this exact JSON format:
{
  "description": "Your compelling marketing description...",
  "summary": "Your powerful 2-3 sentence summary...",
  "categories": ["Category1", "Category2", "Category3"]
}`;

    const result = await baseGenerateContent(excerpt, prompt);
    
    // Validate and enhance the result
    return this.validateAndEnhanceResult(result, options);
  }

  // Create a smart excerpt that captures key content
  private static createSmartExcerpt(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }

    // Try to find natural break points
    const sentences = text.split(/[.!?]+/);
    let excerpt = "";
    let wordCount = 0;
    const targetWords = maxLength / 5; // Rough word estimate

    // Take sentences from the beginning and middle
    const beginningContent = sentences.slice(0, Math.floor(sentences.length * 0.3));
    const middleContent = sentences.slice(
      Math.floor(sentences.length * 0.4),
      Math.floor(sentences.length * 0.7)
    );

    for (const sentence of [...beginningContent, ...middleContent]) {
      const sentenceWords = sentence.trim().split(/\s+/).length;
      if (wordCount + sentenceWords > targetWords) break;
      
      excerpt += sentence.trim() + ". ";
      wordCount += sentenceWords;
    }

    return excerpt.trim() || text.slice(0, maxLength);
  }

  // Get tone-specific instructions
  private static getToneInstructions(tone: string): string {
    const instructions = {
      professional: "using clear, authoritative language that builds credibility",
      casual: "using conversational, approachable language that feels friendly",
      academic: "using scholarly, precise language appropriate for educational content", 
      marketing: "using persuasive, engaging language designed to drive sales",
    };

    return instructions[tone as keyof typeof instructions] || instructions.marketing;
  }

  // Get category guidance
  private static getCategoryGuidance(targetCategories: string[]): string {
    if (targetCategories.length === 0) {
      return "(choose from standard audiobook categories)";
    }
    return `(prefer these if relevant: ${targetCategories.join(", ")})`;
  }

  // Generate SEO keywords
  private static async generateKeywords(
    transcriptionText: string,
    categories: string[]
  ): Promise<string[]> {
    try {
      // Simple keyword extraction from the text
      const words = transcriptionText.toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter(word => word.length > 4);

      // Count word frequency
      const wordCounts = new Map<string, number>();
      words.forEach(word => {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      });

      // Get top keywords, excluding common words
      const commonWords = new Set([
        "about", "after", "again", "against", "before", "being", "between", 
        "during", "from", "having", "into", "more", "most", "other", "some", 
        "such", "than", "that", "them", "these", "they", "this", "those", 
        "through", "time", "very", "were", "will", "with", "would"
      ]);

      const keywords = Array.from(wordCounts.entries())
        .filter(([word, count]) => count >= 3 && !commonWords.has(word))
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([word]) => word);

      // Add category-based keywords
      categories.forEach(category => {
        if (category.toLowerCase().includes(" ")) {
          keywords.push(category.toLowerCase());
        }
      });

      return keywords.slice(0, 8);
    } catch (error) {
      console.warn("Keyword generation failed:", error);
      return [];
    }
  }

  // Validate and enhance the generated result
  private static validateAndEnhanceResult(
    result: { description: string; categories: string[]; summary: string },
    options: Required<ContentGenerationOptions>
  ): { description: string; summary: string; categories: string[] } {
    // Validate description length
    let description = result.description;
    const words = description.split(/\s+/);
    if (words.length > options.maxDescriptionWords) {
      description = words.slice(0, options.maxDescriptionWords).join(" ") + "...";
    }

    // Ensure minimum content quality
    if (description.length < 200) {
      console.warn("Generated description is very short, content quality may be low");
    }

    // Validate categories
    const categories = result.categories
      .slice(0, 3) // Maximum 3 categories
      .filter(cat => cat && cat.trim().length > 0)
      .map(cat => this.normalizeCategory(cat));

    // Ensure we have at least one category
    if (categories.length === 0) {
      categories.push("General Interest");
    }

    return {
      description: description.trim(),
      summary: result.summary.trim(),
      categories,
    };
  }

  // Normalize category names
  private static normalizeCategory(category: string): string {
    // Standard category mappings
    const categoryMap: Record<string, string> = {
      "self-help": "Self-Help",
      "business": "Business",
      "fiction": "Fiction", 
      "non-fiction": "Non-Fiction",
      "biography": "Biography & Memoir",
      "history": "History",
      "science": "Science & Technology",
      "health": "Health & Wellness",
      "psychology": "Psychology",
      "philosophy": "Philosophy",
      "education": "Education",
      "politics": "Politics & Social Sciences",
    };

    const normalized = category.toLowerCase().trim();
    return categoryMap[normalized] || 
           category.split(" ").map(word => 
             word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
           ).join(" ");
  }

  // Calculate confidence score for the generated content
  private static calculateConfidence(
    content: { description: string; categories: string[]; summary: string },
    transcription: TranscriptionResult
  ): number {
    let confidence = 0.5; // Base confidence

    // Adjust based on transcription quality
    confidence += transcription.confidence * 0.3;

    // Adjust based on content length (longer descriptions usually indicate better analysis)
    if (content.description.length > 400) confidence += 0.1;
    if (content.description.length > 600) confidence += 0.1;

    // Adjust based on category specificity
    if (content.categories.length >= 2) confidence += 0.1;

    // Ensure confidence is between 0 and 1
    return Math.min(1, Math.max(0, confidence));
  }
}