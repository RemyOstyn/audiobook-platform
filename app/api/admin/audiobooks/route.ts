import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PrismaClient, AudiobookStatus } from '@prisma/client'
import { AudiobookWhereClause } from '@/lib/types/admin'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated and admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse query parameters for pagination and filtering
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100) // Max 100 per page
    const status = url.searchParams.get('status')
    const search = url.searchParams.get('search')
    const sortBy = url.searchParams.get('sortBy') || 'created_at'
    const sortOrder = url.searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: AudiobookWhereClause = {}
    
    if (status && Object.values(AudiobookStatus).includes(status as AudiobookStatus)) {
      where.status = status as AudiobookStatus
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get total count for pagination
    const totalCount = await prisma.audiobook.count({ where })

    // Get audiobooks with pagination and sorting
    const audiobooks = await prisma.audiobook.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        creator: {
          select: {
            display_name: true
          }
        }
      }
    })

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      audiobooks: audiobooks.map(book => ({
        id: book.id,
        title: book.title,
        author: book.author,
        description: book.description,
        price: Number(book.price),
        status: book.status,
        cover_image_url: book.cover_image_url,
        file_url: book.file_url,
        file_size_bytes: book.file_size_bytes ? Number(book.file_size_bytes) : null,
        duration_seconds: book.duration_seconds,
        uploaded_by: book.creator?.display_name || 'Unknown',
        created_at: book.created_at,
        updated_at: book.updated_at
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    })

  } catch (error) {
    console.error('Audiobooks list API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}