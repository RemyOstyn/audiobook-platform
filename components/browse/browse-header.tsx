"use client"

interface BrowseHeaderProps {
  totalResults: number
  isLoading?: boolean
  searchQuery?: string
}

export function BrowseHeader({ totalResults, isLoading, searchQuery }: BrowseHeaderProps) {
  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {searchQuery ? `Search Results` : 'Browse Audiobooks'}
        </h1>
        <p className="text-sm text-gray-600">
          {searchQuery 
            ? `Results for "${searchQuery}"`
            : 'Discover your next favorite audiobook from our curated collection'
          }
        </p>
      </div>
      
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {isLoading ? (
            'Loading...'
          ) : (
            <>
              {totalResults === 0 
                ? 'No audiobooks found'
                : `${totalResults} audiobook${totalResults === 1 ? '' : 's'} found`
              }
            </>
          )}
        </p>
      </div>
    </div>
  )
}