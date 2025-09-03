import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const clearCartSchema = z.object({
  sessionId: z.string().optional()
})

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    
    const body = await request.json()
    const { sessionId } = clearCartSchema.parse(body)
    
    if (!user && !sessionId) {
      return NextResponse.json(
        { error: 'User not authenticated and no session ID provided' },
        { status: 401 }
      )
    }
    
    // Build the delete query
    let deleteQuery = supabase.from('cart_items').delete()
    
    if (user) {
      deleteQuery = deleteQuery.eq('user_id', user.id)
    } else {
      deleteQuery = deleteQuery.eq('session_id', sessionId)
    }
    
    const { error } = await deleteQuery
    
    if (error) {
      console.error('Error clearing cart:', error)
      return NextResponse.json(
        { error: 'Failed to clear cart' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Clear cart API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}