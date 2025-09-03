"use client"

import { useState, useMemo } from 'react'
import { LibraryHeader } from './library-header'
import { LibraryFilters } from './library-filters'
import { LibraryGrid, type LibraryAudiobook } from './library-grid'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Book } from 'lucide-react'
import Link from 'next/link'

interface LibraryPageClientProps {
  audiobooks: LibraryAudiobook[]
}

export function LibraryPageClient({ audiobooks }: LibraryPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // Get available categories from library
  const availableCategories = useMemo(() => {
    const categories = new Set<string>()
    audiobooks.forEach(book => {
      book.categories.forEach(category => categories.add(category))
    })
    return Array.from(categories).sort()
  }, [audiobooks])

  // Filter audiobooks based on search and filters
  const filteredAudiobooks = useMemo(() => {
    return audiobooks.filter(book => {
      const matchesSearch = !searchQuery || 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = selectedCategories.length === 0 ||
        selectedCategories.some(category => book.categories.includes(category))

      return matchesSearch && matchesCategory
    })
  }, [audiobooks, searchQuery, selectedCategories])

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  if (audiobooks.length === 0) {
    return (
      <div className="space-y-6">
        <LibraryHeader totalResults={0} />
        
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <Book className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">No audiobooks in your library</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Purchase audiobooks to build your personal library.
                </p>
                <Button asChild>
                  <Link href="/browse">Browse Audiobooks</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <LibraryHeader totalResults={filteredAudiobooks.length} />
      
      <LibraryFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategories={selectedCategories}
        onCategoryToggle={handleCategoryToggle}
        availableCategories={availableCategories}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
      />
      
      <LibraryGrid audiobooks={filteredAudiobooks} />
    </div>
  )
}