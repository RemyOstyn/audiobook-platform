import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UserStats } from '@/lib/types/user'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, return placeholder data since we don't have user purchases implemented yet
    // This will be populated in Phase 4 (Payment & User Experience)
    const stats: UserStats = {
      library: {
        totalPurchased: 0
      },
      purchases: {
        totalAmount: 0,
        orderCount: 0
      },
      activity: {
        recentDownloads: 0,
        lastPurchase: undefined
      },
      recentActivity: {
        purchases: []
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