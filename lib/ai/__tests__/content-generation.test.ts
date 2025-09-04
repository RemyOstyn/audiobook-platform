import { ContentGenerationService, ContentGenerationResult } from '../content-generation'
import { OpenAIAPIError } from '../../openai/client'
import type { TranscriptionResult } from '../../audio/transcription'

// Mock the OpenAI client
jest.mock('../../openai/client', () => ({
  generateContent: jest.fn(),
  OpenAIAPIError: class extends Error {
    constructor(message: string, public statusCode?: number, public code?: string) {
      super(message)
      this.name = 'OpenAIAPIError'
    }
  }
}))

const mockGenerateContent = require('../../openai/client').generateContent

describe('ContentGenerationService', () => {
  const mockTranscription: TranscriptionResult = {
    text: 'This is a sample transcription about personal development and productivity. The author discusses various strategies for improving efficiency and achieving goals. It covers time management, habit formation, and mindset shifts that can lead to success.',
    duration: 3600, // 1 hour
    wordCount: 500,
    confidence: 0.95,
    processingTimeMs: 30000
  }

  const mockAIResponse = {
    description: 'A comprehensive guide to personal development that transforms how you approach productivity and success. This audiobook combines practical strategies with psychological insights to help you build lasting habits, manage time effectively, and develop the mindset needed for achieving your goals. Perfect for professionals seeking to optimize their performance.',
    categories: ['Self-Help', 'Business', 'Productivity'],
    summary: 'Learn proven strategies for personal development and productivity. This guide covers time management, habit formation, and mindset shifts for success.'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Suppress console.log during tests
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
    jest.spyOn(console, 'warn').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('generateFromTranscription', () => {
    it('should successfully generate content from transcription', async () => {
      // Arrange
      mockGenerateContent.mockResolvedValue(mockAIResponse)

      // Act
      const result = await ContentGenerationService.generateFromTranscription(
        mockTranscription,
        'Test Audiobook',
        'Test Author'
      )

      // Assert
      expect(result).toBeDefined()
      expect(result.description).toBe(mockAIResponse.description)
      expect(result.summary).toBe(mockAIResponse.summary)
      expect(result.categories).toEqual(['Self-Help', 'Business', 'Productivity'])
      expect(result.keywords).toBeDefined()
      expect(result.metadata.contentLength).toBeGreaterThan(0)
      expect(result.metadata.processingTimeMs).toBeGreaterThan(0)
      expect(result.metadata.confidence).toBeGreaterThan(0)
    })

    it('should handle OpenAI API failures gracefully', async () => {
      // Arrange
      const apiError = new Error('OpenAI API Error: Rate limit exceeded')
      mockGenerateContent.mockRejectedValue(apiError)

      // Act & Assert
      await expect(
        ContentGenerationService.generateFromTranscription(mockTranscription)
      ).rejects.toThrow(OpenAIAPIError)

      await expect(
        ContentGenerationService.generateFromTranscription(mockTranscription)
      ).rejects.toThrow('Content generation failed')
    })

    it('should handle empty transcription text', async () => {
      // Arrange
      const emptyTranscription: TranscriptionResult = {
        text: '',
        duration: 0,
        wordCount: 0,
        confidence: 0.5,
        processingTimeMs: 1000
      }
      
      const emptyResponse = {
        description: 'General audiobook content',
        categories: ['General Interest'],
        summary: 'Audio content summary.'
      }
      
      mockGenerateContent.mockResolvedValue(emptyResponse)

      // Act
      const result = await ContentGenerationService.generateFromTranscription(emptyTranscription)

      // Assert
      expect(result).toBeDefined()
      expect(result.categories).toContain('General Interest')
      expect(result.metadata.confidence).toBeLessThan(0.8) // Lower confidence for empty content
    })

    it('should limit description to max words when specified', async () => {
      // Arrange
      const longDescription = Array(100).fill('word').join(' ') // 100 words
      const longResponse = {
        ...mockAIResponse,
        description: longDescription
      }
      
      mockGenerateContent.mockResolvedValue(longResponse)

      // Act
      const result = await ContentGenerationService.generateFromTranscription(
        mockTranscription,
        undefined,
        undefined,
        { maxDescriptionWords: 50 }
      )

      // Assert
      const wordCount = result.description.split(/\s+/).length
      expect(wordCount).toBeLessThanOrEqual(51) // 50 words + "..." 
      expect(result.description).toMatch(/\.\.\.$/) // Should end with "..."
    })

    it('should normalize categories properly', async () => {
      // Arrange
      const responseWithLowerCase = {
        ...mockAIResponse,
        categories: ['self-help', 'business', 'non-fiction']
      }
      
      mockGenerateContent.mockResolvedValue(responseWithLowerCase)

      // Act
      const result = await ContentGenerationService.generateFromTranscription(mockTranscription)

      // Assert
      expect(result.categories).toEqual(['Self-Help', 'Business', 'Non-Fiction'])
    })

    it('should ensure at least one category is present', async () => {
      // Arrange
      const responseWithNoCategories = {
        ...mockAIResponse,
        categories: []
      }
      
      mockGenerateContent.mockResolvedValue(responseWithNoCategories)

      // Act
      const result = await ContentGenerationService.generateFromTranscription(mockTranscription)

      // Assert
      expect(result.categories).toHaveLength(1)
      expect(result.categories[0]).toBe('General Interest')
    })

    it('should limit categories to maximum of 3', async () => {
      // Arrange
      const responseWithManyCategories = {
        ...mockAIResponse,
        categories: ['Category1', 'Category2', 'Category3', 'Category4', 'Category5']
      }
      
      mockGenerateContent.mockResolvedValue(responseWithManyCategories)

      // Act
      const result = await ContentGenerationService.generateFromTranscription(mockTranscription)

      // Assert
      expect(result.categories).toHaveLength(3)
    })

    it('should generate keywords when includeKeywords is true', async () => {
      // Arrange
      mockGenerateContent.mockResolvedValue(mockAIResponse)

      // Act
      const result = await ContentGenerationService.generateFromTranscription(
        mockTranscription,
        undefined,
        undefined,
        { includeKeywords: true }
      )

      // Assert
      expect(result.keywords).toBeDefined()
      expect(Array.isArray(result.keywords)).toBe(true)
      expect(result.keywords.length).toBeGreaterThanOrEqual(0)
      expect(result.keywords.length).toBeLessThanOrEqual(8)
    })

    it('should skip keyword generation when includeKeywords is false', async () => {
      // Arrange
      mockGenerateContent.mockResolvedValue(mockAIResponse)

      // Act
      const result = await ContentGenerationService.generateFromTranscription(
        mockTranscription,
        undefined,
        undefined,
        { includeKeywords: false }
      )

      // Assert
      expect(result.keywords).toEqual([])
    })

    it('should calculate confidence based on transcription quality', async () => {
      // Arrange
      mockGenerateContent.mockResolvedValue(mockAIResponse)
      
      const highConfidenceTranscription: TranscriptionResult = {
        ...mockTranscription,
        confidence: 0.95
      }

      // Act
      const result = await ContentGenerationService.generateFromTranscription(highConfidenceTranscription)

      // Assert
      expect(result.metadata.confidence).toBeGreaterThan(0.7)
      expect(result.metadata.confidence).toBeLessThanOrEqual(1.0)
    })

    it('should handle network timeouts and service unavailability', async () => {
      // Arrange
      const networkError = new Error('ECONNREFUSED: Connection refused')
      mockGenerateContent.mockRejectedValue(networkError)

      // Act & Assert
      await expect(
        ContentGenerationService.generateFromTranscription(mockTranscription)
      ).rejects.toThrow(OpenAIAPIError)

      expect(console.error).toHaveBeenCalledWith(
        'Content generation failed:',
        expect.any(Error)
      )
    })
  })
})