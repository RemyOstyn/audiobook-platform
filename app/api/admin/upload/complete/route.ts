import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PrismaClient } from '@prisma/client'
import { uploadCompleteSchema } from '@/lib/validators/audiobook'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    
    // Validate request data
    const validation = uploadCompleteSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.error.issues
        },
        { status: 400 }
      )
    }

    const { 
      filePath, 
      fileSize, 
      title,
      author,
      description,
      price,
      coverImageUrl
    } = validation.data

    // Verify file exists in Supabase Storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from('audiobooks')
      .list(filePath.split('/')[0], {
        search: filePath.split('/')[1]
      })

    if (fileError || !fileData || fileData.length === 0) {
      return NextResponse.json(
        { error: 'File not found in storage' },
        { status: 404 }
      )
    }

    // Get public URL for the file
    const { data: publicUrlData } = supabase.storage
      .from('audiobooks')
      .getPublicUrl(filePath)

    // Create audiobook record in database
    const audiobook = await prisma.audiobook.create({
      data: {
        title,
        author,
        description: description || null,
        price,
        cover_image_url: coverImageUrl || null,
        file_url: publicUrlData.publicUrl,
        file_size_bytes: BigInt(fileSize),
        status: 'processing', // Initial status
        created_by: user.id
      }
    })

    // TODO: Queue AI processing job here (Phase 3)
    // This would trigger audio analysis for duration, chapters, etc.

    return NextResponse.json({
      success: true,
      audiobook: {
        id: audiobook.id,
        title: audiobook.title,
        author: audiobook.author,
        status: audiobook.status,
        file_url: audiobook.file_url
      }
    })

  } catch (error) {
    console.error('Upload complete API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}