"use client"

interface LibraryHeaderProps {
  totalResults: number
}

export function LibraryHeader({ totalResults }: LibraryHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Library</h1>
        <p className="text-sm text-muted-foreground">
          Access and download your purchased audiobooks
        </p>
      </div>
      <div className="text-sm text-muted-foreground">
        {totalResults} book{totalResults !== 1 ? 's' : ''}
      </div>
    </div>
  )
}