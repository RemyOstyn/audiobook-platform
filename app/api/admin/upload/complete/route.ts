import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PrismaClient } from '@prisma/client'
import { uploadCompleteSchema } from '@/lib/validators/audiobook'
import { inngest } from '@/lib/inngest/client'

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
    // For new uploads, filePath is just the filename (no folder structure)
    const { data: fileData, error: fileError } = await supabase.storage
      .from('audiobooks')
      .list('', {
        search: filePath
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

    // Trigger AI processing job (Phase 3)
    try {
      await inngest.send({
        name: "audiobook/uploaded",
        data: {
          audiobookId: audiobook.id,
          fileName: filePath, // For new uploads, filePath is just the filename
          fileSize: fileSize,
          filePath: filePath, // Same as fileName for new direct uploads
        },
      });
      
      console.log(`AI processing job started for audiobook ${audiobook.id}`);
    } catch (processingError) {
      console.error('Failed to start processing job:', processingError);
      // Don't fail the upload, but log the error
      // The job can be manually triggered later from the admin dashboard
    }

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