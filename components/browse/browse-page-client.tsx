"use client"

import { useState, useMemo } from 'react'
import { BrowseHeader } from './browse-header'
import { BrowseFilters } from './browse-filters'
import { AudiobookGrid, type Audiobook } from './audiobook-grid'

interface BrowsePageClientProps {
  audiobooks: Audiobook[]
  ownedAudiobookIds: string[]
}

export function BrowsePageClient({ audiobooks, ownedAudiobookIds }: BrowsePageClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100])

  // Filter audiobooks based on search and filters
  const filteredAudiobooks = useMemo(() => {
    return audiobooks.filter(book => {
      const matchesSearch = !searchQuery || 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = selectedCategories.length === 0 ||
        selectedCategories.some(category => book.categories.includes(category))

      const matchesPrice = book.price >= priceRange[0] && book.price <= priceRange[1]

      return matchesSearch && matchesCategory && matchesPrice
    })
  }, [audiobooks, searchQuery, selectedCategories, priceRange])

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  return (
    <div className="space-y-8">
      <BrowseHeader 
        totalResults={filteredAudiobooks.length}
        searchQuery={searchQuery}
      />
      
      <BrowseFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategories={selectedCategories}
        onCategoryToggle={handleCategoryToggle}
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
      />
      
      <AudiobookGrid audiobooks={filteredAudiobooks} ownedAudiobookIds={ownedAudiobookIds} />
    </div>
  )
}