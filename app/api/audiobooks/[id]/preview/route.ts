import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    
    // Get audiobook details (no authentication required for preview)
    const { data: audiobook, error: audiobookError } = await supabase
      .from('audiobooks')
      .select('file_url, title')
      .eq('id', id)
      .eq('status', 'active')
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
    const bucketIndex = audiobook.file_url.indexOf('/object/public/audiobooks/');
    const filePath = bucketIndex !== -1 
      ? audiobook.file_url.substring(bucketIndex + '/object/public/audiobooks/'.length)
      : audiobook.file_url;
    
    console.log('Extracting file path for preview:', { fullUrl: audiobook.file_url, extractedPath: filePath });

    // Generate signed URL for preview (shorter expiry)
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('audiobooks')
      .createSignedUrl(filePath, 1800) // 30 minutes expiry for preview

    if (urlError) {
      console.error('Error generating preview URL:', urlError);
      return NextResponse.json(
        { error: 'Failed to generate preview URL', details: urlError.message },
        { status: 500 }
      )
    }

    if (!signedUrl) {
      console.error('No signed URL returned for preview');
      return NextResponse.json(
        { error: 'Failed to generate preview URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      previewUrl: signedUrl.signedUrl,
      title: audiobook.title
    })

  } catch (error) {
    console.error('Error in preview API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}