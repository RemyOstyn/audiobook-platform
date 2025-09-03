import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface CartItemWithAudiobook {
  id: string
  audiobook_id: string
  quantity: number
  created_at: string
  audiobooks: {
    id: string
    title: string
    author: string
    price: string
    cover_image_url: string | null
    status: string
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    
    // Get session ID from query params for guest users
    const url = new URL(request.url)
    const sessionId = url.searchParams.get('sessionId')
    
    if (!user && !sessionId) {
      return NextResponse.json({ items: [] })
    }
    
    let query = supabase
      .from('cart_items')
      .select(`
        id,
        audiobook_id,
        quantity,
        created_at,
        audiobooks!inner (
          id,
          title,
          author,
          price,
          cover_image_url,
          status
        )
      `)
    
    if (user) {
      query = query.eq('user_id', user.id)
    } else if (sessionId) {
      query = query.eq('session_id', sessionId)
    }
    
    const { data: cartItems, error } = await query as { data: CartItemWithAudiobook[] | null, error: Error | null }
    
    if (error) {
      console.error('Error fetching cart:', error)
      return NextResponse.json(
        { error: 'Failed to fetch cart' },
        { status: 500 }
      )
    }
    
    // Transform data to match client-side cart structure
    const items = cartItems?.map(item => ({
      id: item.id,
      audiobook: {
        id: item.audiobooks.id,
        title: item.audiobooks.title,
        author: item.audiobooks.author,
        price: parseFloat(item.audiobooks.price),
        coverUrl: item.audiobooks.cover_image_url || ''
      },
      quantity: item.quantity,
      addedAt: new Date(item.created_at)
    })) || []
    
    return NextResponse.json({ items })
  } catch (error) {
    console.error('Cart API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}