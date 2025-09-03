import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface CartItem {
  audiobook_id: string
  price: number
}

interface ValidateRequest {
  items: CartItem[]
}

export async function POST(request: NextRequest) {
  try {
    const { items }: ValidateRequest = await request.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Validate each audiobook exists and is active
    const audiobookIds = items.map(item => item.audiobook_id)
    
    const { data: audiobooks, error } = await supabase
      .from('audiobooks')
      .select('id, title, price, status')
      .in('id', audiobookIds)
      .eq('status', 'active')

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to validate cart items' },
        { status: 500 }
      )
    }

    // Check if all requested audiobooks are available
    const availableIds = new Set(audiobooks.map(book => book.id))
    const unavailableItems = items.filter(item => !availableIds.has(item.audiobook_id))

    if (unavailableItems.length > 0) {
      return NextResponse.json(
        { 
          error: 'Some items in your cart are no longer available',
          unavailable_items: unavailableItems.map(item => item.audiobook_id)
        },
        { status: 400 }
      )
    }

    // Verify prices haven't changed
    const priceDiscrepancies = []
    const audiobookMap = new Map(audiobooks.map(book => [book.id, book]))

    for (const item of items) {
      const audiobook = audiobookMap.get(item.audiobook_id)
      if (audiobook && parseFloat(audiobook.price) !== item.price) {
        priceDiscrepancies.push({
          audiobook_id: item.audiobook_id,
          title: audiobook.title,
          expected_price: item.price,
          current_price: parseFloat(audiobook.price)
        })
      }
    }

    if (priceDiscrepancies.length > 0) {
      return NextResponse.json(
        { 
          error: 'Prices have changed for some items in your cart',
          price_discrepancies: priceDiscrepancies
        },
        { status: 400 }
      )
    }

    // All validations passed
    return NextResponse.json({ 
      valid: true,
      message: 'Cart items validated successfully'
    })

  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate cart' },
      { status: 500 }
    )
  }
}