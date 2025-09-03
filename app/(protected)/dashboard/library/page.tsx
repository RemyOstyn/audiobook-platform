import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LibraryPageClient } from '@/components/library/library-page-client'
import { LibraryAudiobook } from '@/components/library/library-grid'

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

export default async function UserLibraryPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Fetch user's library with audiobook details and purchase prices
  const { data: libraryItems, error } = await supabase
    .from('user_library')
    .select(`
      id,
      audiobook_id,
      purchased_at,
      download_count,
      last_accessed,
      order:orders (
        order_number,
        order_items (
          price
        )
      ),
      audiobook:audiobooks (
        id,
        title,
        author,
        narrator,
        duration_seconds,
        cover_image_url,
        file_url,
        description,
        price,
        categories
      )
    `)
    .eq('user_id', user.id)
    .order('purchased_at', { ascending: false })

  // Format data for the client component
  const library: LibraryAudiobook[] = libraryItems?.map(item => {
    const audiobook = Array.isArray(item.audiobook) ? item.audiobook[0] : item.audiobook
    
    return {
      id: item.audiobook_id,
      title: audiobook.title,
      author: audiobook.author,
      narrator: audiobook.narrator,
      coverUrl: audiobook.cover_image_url || '',
      categories: audiobook.categories || [],
      description: audiobook.description || '',
      duration: audiobook.duration_seconds ? formatDuration(audiobook.duration_seconds) : undefined,
      purchaseDate: item.purchased_at,
      downloadCount: item.download_count,
      lastAccessed: item.last_accessed
    }
  }) || []

  if (error) {
    console.error('Error fetching library:', error)
  }

  return <LibraryPageClient audiobooks={library} />
}