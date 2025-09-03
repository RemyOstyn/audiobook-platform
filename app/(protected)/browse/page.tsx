import { BrowsePageClient } from '@/components/browse/browse-page-client'
import { createClient } from '@/lib/supabase/server'

interface FormattedAudiobook {
  id: string
  title: string
  author: string
  price: number
  coverUrl: string
  categories: string[]
  description: string
  duration?: string
  rating?: number
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

export default async function BrowsePage({ searchParams }: {
  searchParams?: Promise<{ search?: string }>
}) {
  // Await searchParams as required by Next.js 15
  const params = await searchParams
  const searchQuery = params?.search

  // Fetch audiobooks directly from Supabase
  const supabase = await createClient()
  
  let query = supabase
    .from('audiobooks')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // Add search functionality
  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
  }

  let audiobooks: FormattedAudiobook[] = []
  try {
    const { data, error } = await query

    if (error) {
      console.error('Error fetching audiobooks:', error)
    } else {
      // Format the data for the frontend
      audiobooks = data?.map(book => ({
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
    }
  } catch (error) {
    console.error('Error fetching audiobooks:', error)
  }

  return <BrowsePageClient audiobooks={audiobooks} />
}