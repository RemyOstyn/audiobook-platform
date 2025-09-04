/**
 * @jest-environment node
 */

import { POST } from '../add/route'
import { NextRequest } from 'next/server'

// Mock Supabase client with proper chaining
const mockSupabase = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  single: jest.fn(),
  update: jest.fn(() => ({
    eq: jest.fn().mockResolvedValue({ error: null })
  })),
  insert: jest.fn()
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase))
}))

describe('/api/cart/add', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Suppress console errors during tests
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/cart/add', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  describe('Authenticated users', () => {
    beforeEach(() => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } }
      })
    })

    it('should successfully add new item to cart', async () => {
      // Arrange
      const requestBody = { audiobookId: 'audiobook-123' }
      
      // Mock audiobook exists and is active
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: 'audiobook-123', status: 'active' },
          error: null
        })
        // Mock user doesn't own the audiobook
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' } // Not found
        })
        // Mock item doesn't exist in cart
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' }
        })

      mockSupabase.insert.mockResolvedValue({ error: null })

      // Act
      const response = await POST(createRequest(requestBody))
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        audiobook_id: 'audiobook-123',
        quantity: 1,
        user_id: 'user-123'
      })
    })

    it('should update quantity if item already exists in cart', async () => {
      // Arrange
      const requestBody = { audiobookId: 'audiobook-123' }
      
      // Mock audiobook exists
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: 'audiobook-123', status: 'active' },
          error: null
        })
        // Mock user doesn't own audiobook
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' }
        })
        // Mock item exists in cart
        .mockResolvedValueOnce({
          data: { id: 'cart-item-123', quantity: 1 },
          error: null
        })


      // Act
      const response = await POST(createRequest(requestBody))
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(mockSupabase.update).toHaveBeenCalledWith({ quantity: 2 })
    })

    it('should reject if user already owns the audiobook', async () => {
      // Arrange
      const requestBody = { audiobookId: 'audiobook-123' }
      
      // Mock audiobook exists
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: 'audiobook-123', status: 'active' },
          error: null
        })
        // Mock user owns the audiobook
        .mockResolvedValueOnce({
          data: { id: 'library-123' },
          error: null
        })

      // Act
      const response = await POST(createRequest(requestBody))
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.error).toBe('You already own this audiobook')
    })

    it('should reject if audiobook does not exist', async () => {
      // Arrange
      const requestBody = { audiobookId: 'nonexistent-audiobook' }
      
      // Mock audiobook doesn't exist
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })

      // Act
      const response = await POST(createRequest(requestBody))
      const result = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(result.error).toBe('Audiobook not found or not available')
    })
  })

  describe('Guest users', () => {
    beforeEach(() => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null }
      })
    })

    it('should successfully add item to cart with session ID', async () => {
      // Arrange
      const requestBody = { 
        audiobookId: 'audiobook-123',
        sessionId: 'session-123'
      }
      
      // Mock audiobook exists
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: 'audiobook-123', status: 'active' },
          error: null
        })
        // Mock item doesn't exist in cart
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' }
        })

      mockSupabase.insert.mockResolvedValue({ error: null })

      // Act
      const response = await POST(createRequest(requestBody))
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        audiobook_id: 'audiobook-123',
        quantity: 1,
        session_id: 'session-123'
      })
    })

    it('should reject if no session ID provided for guest user', async () => {
      // Arrange
      const requestBody = { audiobookId: 'audiobook-123' }

      // Act
      const response = await POST(createRequest(requestBody))
      const result = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(result.error).toBe('User not authenticated and no session ID provided')
    })
  })

  describe('Input validation', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })
    })

    it('should validate required audiobookId', async () => {
      // Arrange
      const requestBody = {} // Missing audiobookId

      // Act
      const response = await POST(createRequest(requestBody))

      // Assert
      expect(response.status).toBe(500) // Will throw validation error
    })

    it('should handle malformed JSON', async () => {
      // Arrange
      const malformedRequest = new NextRequest('http://localhost:3000/api/cart/add', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' }
      })

      // Act
      const response = await POST(malformedRequest)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(result.error).toBe('Internal server error')
    })
  })

  describe('Database error handling', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } }
      })
    })

    it('should handle database connection errors', async () => {
      // Arrange
      const requestBody = { audiobookId: 'audiobook-123' }
      
      // Mock database error
      mockSupabase.single.mockRejectedValue(new Error('Database connection failed'))

      // Act
      const response = await POST(createRequest(requestBody))
      const result = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(result.error).toBe('Internal server error')
      expect(console.error).toHaveBeenCalledWith(
        'Add to cart API error:',
        expect.any(Error)
      )
    })

    it('should handle cart update errors', async () => {
      // Arrange
      const requestBody = { audiobookId: 'audiobook-123' }
      
      // Mock successful checks but failed update
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: 'audiobook-123', status: 'active' },
          error: null
        })
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' }
        })
        .mockResolvedValueOnce({
          data: { id: 'cart-item-123', quantity: 1 },
          error: null
        })

      // Mock update to return error
      mockSupabase.update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: { message: 'Update failed' } })
      })

      // Act
      const response = await POST(createRequest(requestBody))
      const result = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(result.error).toBe('Failed to update cart item')
    })
  })
})