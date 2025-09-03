import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    
    let query = supabase
      .from('audiobooks')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    // Add search functionality
    if (search) {
      query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: audiobooks, error } = await query

    if (error) {
      console.error('Error fetching audiobooks:', error)
      return NextResponse.json(
        { error: 'Failed to fetch audiobooks' }, 
        { status: 500 }
      )
    }

    // Format the data for the frontend
    const formattedAudiobooks = audiobooks?.map(book => ({
      id: book.id,
      title: book.title,
      author: book.author,
      price: parseFloat(book.price),
      coverUrl: book.cover_image_url || '',
      categories: book.categories || [],
      description: book.description || '',
      duration: book.duration_seconds ? formatDuration(book.duration_seconds) : undefined,
      rating: undefined // Will be implemented when reviews are added
    })) || []

    return NextResponse.json(formattedAudiobooks)
  } catch (error) {
    console.error('Error in audiobooks API:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}