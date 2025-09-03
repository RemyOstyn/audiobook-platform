import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const syncCartSchema = z.object({
  sessionId: z.string()
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { sessionId } = syncCartSchema.parse(body)
    
    // Get guest cart items
    const { data: guestItems } = await supabase
      .from('cart_items')
      .select('audiobook_id, quantity')
      .eq('session_id', sessionId)
    
    if (!guestItems || guestItems.length === 0) {
      return NextResponse.json({ success: true, message: 'No guest cart items to sync' })
    }
    
    // Process each guest cart item
    for (const guestItem of guestItems) {
      // Check if user already has this item in their cart
      const { data: existingUserItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('audiobook_id', guestItem.audiobook_id)
        .single()
      
      if (existingUserItem) {
        // Update existing user cart item by adding guest quantity
        await supabase
          .from('cart_items')
          .update({ quantity: existingUserItem.quantity + guestItem.quantity })
          .eq('id', existingUserItem.id)
      } else {
        // Move guest item to user cart
        await supabase
          .from('cart_items')
          .update({
            user_id: user.id,
            session_id: null
          })
          .eq('session_id', sessionId)
          .eq('audiobook_id', guestItem.audiobook_id)
      }
    }
    
    // Clean up any remaining guest cart items for this session
    await supabase
      .from('cart_items')
      .delete()
      .eq('session_id', sessionId)
    
    return NextResponse.json({ success: true, message: 'Cart synced successfully' })
  } catch (error) {
    console.error('Sync cart API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}