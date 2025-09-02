import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Simple role check for admin access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Return mock stats matching the expected structure
    const stats = {
      audiobooks: {
        total: 0,
        active: 0,
        processing: 0
      },
      users: {
        total: 0,
        recentSignups: 0
      },
      processing: {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0
      },
      storage: {
        totalGB: 0
      },
      recentActivity: {
        audiobooks: [],
        processingJobs: []
      }
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Admin stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}