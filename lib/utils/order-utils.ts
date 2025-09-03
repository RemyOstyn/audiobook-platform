/**
 * Generates a unique order number in the format: ORD-YYYY-NNNNNN
 * Example: ORD-2025-000001
 */
export function generateOrderNumber(): string {
  const year = new Date().getFullYear()
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  const sequence = (timestamp % 1000000).toString().padStart(6, '0')
  
  return `ORD-${year}-${sequence}${random}`
}

/**
 * Calculates the total price for a list of cart items
 */
export function calculateOrderTotal(items: Array<{ price: number, quantity?: number }>): number {
  return items.reduce((total, item) => {
    const quantity = item.quantity || 1
    return total + (item.price * quantity)
  }, 0)
}

/**
 * Validates order data before processing
 */
export function validateOrderData(data: {
  email: string
  firstName: string
  lastName: string
  items: Array<{ audiobook_id: string, price: number }>
  totalAmount: number
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.email || !data.email.includes('@')) {
    errors.push('Valid email is required')
  }

  if (!data.firstName || data.firstName.trim().length === 0) {
    errors.push('First name is required')
  }

  if (!data.lastName || data.lastName.trim().length === 0) {
    errors.push('Last name is required')
  }

  if (!data.items || data.items.length === 0) {
    errors.push('Order must contain at least one item')
  }

  if (data.totalAmount <= 0) {
    errors.push('Order total must be greater than zero')
  }

  // Validate each item
  if (data.items) {
    data.items.forEach((item, index) => {
      if (!item.audiobook_id) {
        errors.push(`Item ${index + 1}: Audiobook ID is required`)
      }
      if (typeof item.price !== 'number' || item.price <= 0) {
        errors.push(`Item ${index + 1}: Valid price is required`)
      }
    })
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Formats order metadata for storage
 */
export function formatOrderMetadata(data: {
  paymentMethod: string
  firstName: string
  lastName: string
  itemCount: number
}): Record<string, string | number | boolean> {
  return {
    customer_name: `${data.firstName} ${data.lastName}`,
    payment_method: data.paymentMethod,
    item_count: data.itemCount,
    processed_at: new Date().toISOString(),
    demo_mode: true
  }
}