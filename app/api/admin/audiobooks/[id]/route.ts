import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PrismaClient, AudiobookStatus } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Schema for updating audiobooks - all fields optional for partial updates
const updateAudiobookSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters").optional(),
  author: z.string().min(1, "Author is required").max(100, "Author must be less than 100 characters").optional(),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
  price: z.number().min(0, "Price must be positive").max(999.99, "Price must be less than $999.99").optional(),
  cover_image_url: z.string().url("Must be a valid URL").optional(),
  status: z.nativeEnum(AudiobookStatus).optional(),
  narrator: z.string().max(100, "Narrator name must be less than 100 characters").optional(),
  isbn: z.string().max(13, "ISBN must be less than 13 characters").optional(),
  publication_year: z.number().min(1000).max(new Date().getFullYear()).optional(),
  categories: z.array(z.string()).max(5, "Maximum 5 categories allowed").optional(),
})

async function verifyAdminAccess() {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { error: 'Unauthorized', status: 401 }
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Admin access required', status: 403 }
  }

  return { user, profile }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAccess()
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { id } = await context.params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid audiobook ID format' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = updateAudiobookSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.format()
        },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    // Check if audiobook exists
    const existingAudiobook = await prisma.audiobook.findUnique({
      where: { id }
    })

    if (!existingAudiobook) {
      return NextResponse.json(
        { error: 'Audiobook not found' },
        { status: 404 }
      )
    }

    // Update the audiobook
    const updatedAudiobook = await prisma.audiobook.update({
      where: { id },
      data: {
        ...updateData,
        updated_at: new Date()
      },
      include: {
        creator: {
          select: {
            display_name: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      audiobook: {
        id: updatedAudiobook.id,
        title: updatedAudiobook.title,
        author: updatedAudiobook.author,
        narrator: updatedAudiobook.narrator,
        description: updatedAudiobook.description,
        price: Number(updatedAudiobook.price),
        status: updatedAudiobook.status,
        cover_image_url: updatedAudiobook.cover_image_url,
        isbn: updatedAudiobook.isbn,
        publication_year: updatedAudiobook.publication_year,
        categories: updatedAudiobook.categories,
        file_url: updatedAudiobook.file_url,
        file_size_bytes: updatedAudiobook.file_size_bytes ? Number(updatedAudiobook.file_size_bytes) : null,
        duration_seconds: updatedAudiobook.duration_seconds,
        uploaded_by: updatedAudiobook.creator?.display_name || 'Unknown',
        created_at: updatedAudiobook.created_at,
        updated_at: updatedAudiobook.updated_at
      }
    })

  } catch (error) {
    console.error('Update audiobook API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAccess()
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    const { id } = await context.params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid audiobook ID format' },
        { status: 400 }
      )
    }

    // Check if audiobook exists
    const existingAudiobook = await prisma.audiobook.findUnique({
      where: { id }
    })

    if (!existingAudiobook) {
      return NextResponse.json(
        { error: 'Audiobook not found' },
        { status: 404 }
      )
    }

    // Parse query parameter to determine delete type (soft vs hard)
    const url = new URL(request.url)
    const hardDelete = url.searchParams.get('hard') === 'true'

    if (hardDelete) {
      // Hard delete: Remove from database and storage
      // First delete the audiobook record (cascade will handle related records)
      await prisma.audiobook.delete({
        where: { id }
      })

      // TODO: Optionally delete file from Supabase Storage
      // This would require the Supabase service role key and storage client
      // For now, we'll just delete the database record
      
      return NextResponse.json({
        success: true,
        message: 'Audiobook permanently deleted'
      })
    } else {
      // Soft delete: Set status to inactive
      const updatedAudiobook = await prisma.audiobook.update({
        where: { id },
        data: {
          status: AudiobookStatus.inactive,
          updated_at: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Audiobook set to inactive',
        audiobook: {
          id: updatedAudiobook.id,
          title: updatedAudiobook.title,
          status: updatedAudiobook.status,
          updated_at: updatedAudiobook.updated_at
        }
      })
    }

  } catch (error) {
    console.error('Delete audiobook API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}