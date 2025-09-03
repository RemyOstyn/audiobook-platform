import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params
    
    if (!orderNumber) {
      return NextResponse.json(
        { error: 'Order number is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch order with order items and audiobook details
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        email,
        total_amount,
        status,
        completed_at,
        created_at,
        order_items (
          id,
          price,
          audiobook:audiobooks (
            id,
            title,
            author,
            cover_image_url
          )
        )
      `)
      .eq('order_number', orderNumber)
      .single()

    if (error) {
      console.error('Order fetch error:', error)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      order,
      message: 'Order details retrieved successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    )
  }
}