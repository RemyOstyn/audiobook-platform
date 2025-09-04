import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UserStats } from '@/lib/types/user'

interface AudiobookData {
  id: string
  title: string
  author: string
  cover_image_url?: string
}

// Supabase can return audiobook as either array or single object depending on the query syntax
interface OrderItem {
  id: string
  price: string
  audiobook: AudiobookData[] | AudiobookData
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's purchases statistics
    const [libraryResult, ordersResult, recentActivityResult] = await Promise.all([
      // Total purchased audiobooks
      supabase
        .from('user_library')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id),
      
      // Order statistics
      supabase
        .from('orders')
        .select('total_amount, completed_at', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'completed'),
      
      // Recent activity - last 5 purchases
      supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          completed_at,
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
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(5)
    ])

    // Calculate totals
    const totalPurchased = libraryResult.count || 0
    const totalAmount = ordersResult.data?.reduce((sum, order) => 
      sum + parseFloat(order.total_amount), 0) || 0
    const orderCount = ordersResult.count || 0
    
    // Get last purchase date
    const lastPurchase = ordersResult.data?.[0]?.completed_at

    // Format recent activity - flatten order items into individual purchase records
    const recentPurchases = recentActivityResult.data?.flatMap(order => 
      (order.order_items || []).map((item: OrderItem) => {
        // Handle both array and single object formats for audiobook relationship
        const audiobook = Array.isArray(item.audiobook) ? item.audiobook[0] : item.audiobook
        
        return {
          id: `${order.id}-${item.id}`, // Unique ID for each item
          audiobook: {
            id: audiobook?.id || '',
            title: audiobook?.title || 'Unknown',
            author: audiobook?.author || 'Unknown',
            coverImageUrl: audiobook?.cover_image_url || null
          },
          price: parseFloat(item.price),
          purchasedAt: order.completed_at,
          orderNumber: order.order_number
        }
      })
    ) || []

    const stats: UserStats = {
      library: {
        totalPurchased
      },
      purchases: {
        totalAmount,
        orderCount
      },
      activity: {
        recentDownloads: 0, // This would need download tracking
        lastPurchase
      },
      recentActivity: {
        purchases: recentPurchases
      }
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}