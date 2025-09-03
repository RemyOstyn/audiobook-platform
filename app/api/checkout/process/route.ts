import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateOrderNumber, validateOrderData, formatOrderMetadata } from '@/lib/utils/order-utils'

interface OrderItem {
  audiobook_id: string
  price: number
}

interface ProcessOrderRequest {
  email: string
  firstName: string
  lastName: string
  paymentMethod: string
  items: OrderItem[]
  totalAmount: number
}

export async function POST(request: NextRequest) {
  try {
    const orderData: ProcessOrderRequest = await request.json()

    // Validate request data
    const validation = validateOrderData(orderData)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid order data', details: validation.errors },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Generate unique order number
    const orderNumber = generateOrderNumber()

    // Start database transaction
    const { error: transactionError } = await supabase.rpc(
      'process_order_transaction',
      {
        p_order_number: orderNumber,
        p_user_id: user?.id || null,
        p_email: orderData.email,
        p_total_amount: orderData.totalAmount,
        p_payment_method: orderData.paymentMethod,
        p_metadata: formatOrderMetadata({
          paymentMethod: orderData.paymentMethod,
          firstName: orderData.firstName,
          lastName: orderData.lastName,
          itemCount: orderData.items.length
        }),
        p_items: orderData.items.map(item => ({
          audiobook_id: item.audiobook_id,
          price: item.price
        }))
      }
    )

    // If RPC doesn't exist, fallback to manual transaction
    if (transactionError && transactionError.message?.includes('function')) {
      return await processOrderManually(supabase, orderData, orderNumber, user?.id || null)
    }

    if (transactionError) {
      console.error('Transaction error:', transactionError)
      return NextResponse.json(
        { error: 'Failed to process order' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      order: {
        order_number: orderNumber,
        total_amount: orderData.totalAmount,
        items: orderData.items,
        email: orderData.email
      },
      message: 'Order processed successfully'
    })

  } catch (error) {
    console.error('Order processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process order' },
      { status: 500 }
    )
  }
}

// Fallback manual transaction processing
async function processOrderManually(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderData: ProcessOrderRequest,
  orderNumber: string,
  userId: string | null
) {
  try {
    // 1. Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: userId,
        email: orderData.email,
        total_amount: orderData.totalAmount,
        status: 'completed',
        payment_method: orderData.paymentMethod,
        metadata: formatOrderMetadata({
          paymentMethod: orderData.paymentMethod,
          firstName: orderData.firstName,
          lastName: orderData.lastName,
          itemCount: orderData.items.length
        }),
        completed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (orderError) {
      throw new Error('Failed to create order: ' + orderError.message)
    }

    // 2. Create order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      audiobook_id: item.audiobook_id,
      price: item.price
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      throw new Error('Failed to create order items: ' + itemsError.message)
    }

    // 3. Add to user library (if user is logged in)
    if (userId) {
      const libraryEntries = orderData.items.map(item => ({
        user_id: userId,
        audiobook_id: item.audiobook_id,
        order_id: order.id,
        purchased_at: new Date().toISOString()
      }))

      const { error: libraryError } = await supabase
        .from('user_library')
        .insert(libraryEntries)

      if (libraryError) {
        console.warn('Failed to add to user library:', libraryError)
        // Don't fail the order for this, but log it
      }

      // 4. Clear user's cart
      const { error: cartError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId)

      if (cartError) {
        console.warn('Failed to clear cart:', cartError)
        // Don't fail the order for this
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        order_number: orderNumber,
        total_amount: orderData.totalAmount,
        items: orderData.items,
        email: orderData.email
      },
      message: 'Order processed successfully'
    })

  } catch (error) {
    console.error('Manual transaction error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process order' },
      { status: 500 }
    )
  }
}