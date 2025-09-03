import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user owns this audiobook
    const { data: libraryItem, error: libraryError } = await supabase
      .from('user_library')
      .select('id, audiobook_id')
      .eq('user_id', user.id)
      .eq('audiobook_id', id)
      .single()

    if (libraryError || !libraryItem) {
      return NextResponse.json(
        { error: 'Audiobook not found in your library' },
        { status: 404 }
      )
    }

    // Get audiobook details
    const { data: audiobook, error: audiobookError } = await supabase
      .from('audiobooks')
      .select('file_url, title')
      .eq('id', id)
      .single()

    if (audiobookError || !audiobook) {
      return NextResponse.json(
        { error: 'Audiobook not found' },
        { status: 404 }
      )
    }

    if (!audiobook.file_url) {
      return NextResponse.json(
        { error: 'Audiobook file not available' },
        { status: 400 }
      )
    }

    // Extract file path from full URL
    // file_url format: https://[project].supabase.co/storage/v1/object/public/audiobooks/path/to/file.mp3
    const bucketIndex = audiobook.file_url.indexOf('/object/public/audiobooks/');
    const filePath = bucketIndex !== -1 
      ? audiobook.file_url.substring(bucketIndex + '/object/public/audiobooks/'.length)
      : audiobook.file_url; // Fallback if format is different
    
    console.log('Extracting file path for stream:', { fullUrl: audiobook.file_url, extractedPath: filePath });

    // Generate signed URL for streaming (longer expiry for streaming)
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('audiobooks')
      .createSignedUrl(filePath, 7200) // 2 hours expiry for streaming

    if (urlError) {
      console.error('Error generating stream URL:', urlError);
      return NextResponse.json(
        { error: 'Failed to generate stream URL', details: urlError.message },
        { status: 500 }
      )
    }

    if (!signedUrl) {
      console.error('No signed URL returned for stream');
      return NextResponse.json(
        { error: 'Failed to generate stream URL' },
        { status: 500 }
      )
    }

    // Update last accessed timestamp
    await supabase
      .from('user_library')
      .update({ 
        last_accessed: new Date().toISOString()
      })
      .eq('id', libraryItem.id)

    return NextResponse.json({
      streamUrl: signedUrl.signedUrl,
      title: audiobook.title
    })

  } catch (error) {
    console.error('Error in stream API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}