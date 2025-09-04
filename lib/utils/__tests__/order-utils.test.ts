import { 
  generateOrderNumber, 
  calculateOrderTotal, 
  validateOrderData, 
  formatOrderMetadata 
} from '../order-utils'

describe('order-utils', () => {
  describe('generateOrderNumber', () => {
    it('should generate order number in correct format', () => {
      const orderNumber = generateOrderNumber()
      
      // Should match pattern: ORD-YYYY-NNNNNNNNN
      expect(orderNumber).toMatch(/^ORD-\d{4}-\d{9}$/)
      
      // Should contain current year
      const currentYear = new Date().getFullYear()
      expect(orderNumber).toContain(`ORD-${currentYear}-`)
    })

    it('should generate unique order numbers', () => {
      const orderNumber1 = generateOrderNumber()
      const orderNumber2 = generateOrderNumber()
      
      expect(orderNumber1).not.toBe(orderNumber2)
    })
  })

  describe('calculateOrderTotal', () => {
    it('should calculate total for single item', () => {
      const items = [{ price: 29.99 }]
      const total = calculateOrderTotal(items)
      
      expect(total).toBe(29.99)
    })

    it('should calculate total for multiple items', () => {
      const items = [
        { price: 19.99 },
        { price: 24.99 },
        { price: 15.00 }
      ]
      const total = calculateOrderTotal(items)
      
      expect(total).toBe(59.98)
    })

    it('should handle quantity when provided', () => {
      const items = [
        { price: 10.00, quantity: 2 },
        { price: 15.00, quantity: 3 }
      ]
      const total = calculateOrderTotal(items)
      
      expect(total).toBe(65.00) // (10 * 2) + (15 * 3)
    })

    it('should default quantity to 1 when not provided', () => {
      const items = [{ price: 20.00 }]
      const total = calculateOrderTotal(items)
      
      expect(total).toBe(20.00)
    })

    it('should return 0 for empty items array', () => {
      const total = calculateOrderTotal([])
      
      expect(total).toBe(0)
    })
  })

  describe('validateOrderData', () => {
    const validOrderData = {
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      items: [{ audiobook_id: 'book-1', price: 19.99 }],
      totalAmount: 19.99
    }

    it('should validate correct order data', () => {
      const result = validateOrderData(validOrderData)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid email', () => {
      const invalidData = { ...validOrderData, email: 'invalid-email' }
      const result = validateOrderData(invalidData)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Valid email is required')
    })

    it('should reject missing first name', () => {
      const invalidData = { ...validOrderData, firstName: '' }
      const result = validateOrderData(invalidData)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('First name is required')
    })

    it('should reject missing last name', () => {
      const invalidData = { ...validOrderData, lastName: '   ' }
      const result = validateOrderData(invalidData)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Last name is required')
    })

    it('should reject empty items array', () => {
      const invalidData = { ...validOrderData, items: [] }
      const result = validateOrderData(invalidData)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Order must contain at least one item')
    })

    it('should reject zero total amount', () => {
      const invalidData = { ...validOrderData, totalAmount: 0 }
      const result = validateOrderData(invalidData)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Order total must be greater than zero')
    })

    it('should validate item data', () => {
      const invalidData = { 
        ...validOrderData, 
        items: [{ audiobook_id: '', price: -5 }]
      }
      const result = validateOrderData(invalidData)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Item 1: Audiobook ID is required')
      expect(result.errors).toContain('Item 1: Valid price is required')
    })
  })

  describe('formatOrderMetadata', () => {
    it('should format metadata correctly', () => {
      const data = {
        paymentMethod: 'credit_card',
        firstName: 'John',
        lastName: 'Doe',
        itemCount: 3
      }
      
      const metadata = formatOrderMetadata(data)
      
      expect(metadata).toEqual({
        customer_name: 'John Doe',
        payment_method: 'credit_card',
        item_count: 3,
        processed_at: expect.any(String),
        demo_mode: true
      })
      
      // Verify processed_at is a valid ISO string
      expect(new Date(metadata.processed_at as string).toISOString()).toBe(metadata.processed_at)
    })

    it('should handle single character names', () => {
      const data = {
        paymentMethod: 'paypal',
        firstName: 'A',
        lastName: 'B',
        itemCount: 1
      }
      
      const metadata = formatOrderMetadata(data)
      
      expect(metadata.customer_name).toBe('A B')
    })
  })
})