import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

    // Fetch real statistics from the database
    const [
      audiobookStats,
      userStats,
      processingStats,
      recentAudiobooks,
      recentJobs,
      storageStats
    ] = await Promise.all([
      // Audiobook statistics
      prisma.audiobook.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      
      // User statistics (from Supabase profiles table)
      supabase
        .from('profiles')
        .select('created_at', { count: 'exact' }),
      
      // Processing job statistics
      prisma.processingJob.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      
      // Recent audiobooks
      prisma.audiobook.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          title: true,
          author: true,
          status: true,
          created_at: true,
        }
      }),
      
      // Recent processing jobs
      prisma.processingJob.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
          audiobook: {
            select: {
              title: true,
              author: true,
            }
          }
        }
      }),
      
      // Storage statistics (approximation based on file sizes)
      prisma.audiobook.aggregate({
        _sum: { file_size_bytes: true },
        _count: { id: true }
      })
    ])

    // Process audiobook statistics
    const audiobookCounts = audiobookStats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.status
      return acc
    }, {} as Record<string, number>)

    // Process user statistics
    const totalUsers = userStats.count || 0
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    // Get recent signups count
    const { count: recentSignupsCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo.toISOString())

    // Process processing job statistics
    const processingCounts = processingStats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.status
      return acc
    }, {} as Record<string, number>)

    // Calculate storage in GB
    const totalStorageBytes = Number(storageStats._sum.file_size_bytes || 0)
    const totalStorageGB = Math.round((totalStorageBytes / (1024 * 1024 * 1024)) * 100) / 100

    const stats = {
      audiobooks: {
        total: audiobookCounts.active + audiobookCounts.processing + audiobookCounts.uploaded || 0,
        active: audiobookCounts.active || 0,
        processing: audiobookCounts.processing || 0
      },
      users: {
        total: totalUsers,
        recentSignups: recentSignupsCount || 0
      },
      processing: {
        pending: processingCounts.pending || 0,
        processing: (processingCounts.downloading || 0) + 
                   (processingCounts.chunking || 0) + 
                   (processingCounts.transcribing || 0) + 
                   (processingCounts.generating_content || 0),
        completed: processingCounts.completed || 0,
        failed: processingCounts.failed || 0
      },
      storage: {
        totalGB: totalStorageGB
      },
      recentActivity: {
        audiobooks: recentAudiobooks.map(book => ({
          id: book.id,
          title: book.title,
          author: book.author,
          status: book.status,
          created_at: book.created_at
        })),
        processingJobs: recentJobs.map(job => ({
          id: job.id,
          job_type: job.job_type,
          audiobookId: job.audiobook_id,
          status: job.status,
          progress: job.progress,
          created_at: job.created_at,
          audiobook: job.audiobook
        }))
      }
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Admin stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}