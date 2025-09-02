import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { presignedUrlRequestSchema } from '@/lib/validators/audiobook'
import { nanoid } from 'nanoid'

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
    const validation = presignedUrlRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.error.issues
        },
        { status: 400 }
      )
    }

    const { fileName } = validation.data

    // Generate unique file path - store directly in bucket without subfolder
    const fileExtension = fileName.split('.').pop()
    const uniqueFileName = `${nanoid()}.${fileExtension}`
    const filePath = uniqueFileName

    // Create presigned URL for upload (expires in 1 hour)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audiobooks')
      .createSignedUploadUrl(filePath, {
        upsert: false
      })

    if (uploadError) {
      console.error('Supabase upload URL error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to create upload URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      uploadUrl: uploadData.signedUrl,
      filePath: filePath,
      token: uploadData.token,
      expiresIn: 3600
    })

  } catch (error) {
    console.error('Presigned URL API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}