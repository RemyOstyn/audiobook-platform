import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const addToCartSchema = z.object({
  audiobookId: z.string(),
  sessionId: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    
    const body = await request.json()
    const { audiobookId, sessionId } = addToCartSchema.parse(body)
    
    if (!user && !sessionId) {
      return NextResponse.json(
        { error: 'User not authenticated and no session ID provided' },
        { status: 401 }
      )
    }
    
    // Check if audiobook exists and is active
    const { data: audiobook, error: audiobookError } = await supabase
      .from('audiobooks')
      .select('id, status')
      .eq('id', audiobookId)
      .eq('status', 'active')
      .single()
    
    if (audiobookError || !audiobook) {
      return NextResponse.json(
        { error: 'Audiobook not found or not available' },
        { status: 404 }
      )
    }
    
    // Check if item already exists in cart
    let existingItemQuery = supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('audiobook_id', audiobookId)
    
    if (user) {
      existingItemQuery = existingItemQuery.eq('user_id', user.id)
    } else {
      existingItemQuery = existingItemQuery.eq('session_id', sessionId)
    }
    
    const { data: existingItem } = await existingItemQuery.single()
    
    if (existingItem) {
      // Update existing item quantity
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + 1 })
        .eq('id', existingItem.id)
      
      if (updateError) {
        console.error('Error updating cart item:', updateError)
        return NextResponse.json(
          { error: 'Failed to update cart item' },
          { status: 500 }
        )
      }
    } else {
      // Add new item to cart
      const insertData: {
        audiobook_id: string
        quantity: number
        user_id?: string
        session_id?: string
      } = {
        audiobook_id: audiobookId,
        quantity: 1
      }
      
      if (user) {
        insertData.user_id = user.id
      } else {
        insertData.session_id = sessionId
      }
      
      const { error: insertError } = await supabase
        .from('cart_items')
        .insert(insertData)
      
      if (insertError) {
        console.error('Error adding item to cart:', insertError)
        return NextResponse.json(
          { error: 'Failed to add item to cart' },
          { status: 500 }
        )
      }
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Add to cart API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}