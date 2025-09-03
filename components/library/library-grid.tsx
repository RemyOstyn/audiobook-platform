"use client"

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Book, Download, Play, Calendar } from 'lucide-react'
import { AudioPlayerModal } from '@/components/audio-player-modal'

export interface LibraryAudiobook {
  id: string
  title: string
  author: string
  narrator?: string
  coverUrl: string
  categories: string[]
  description: string
  duration?: string
  purchaseDate: string
  downloadCount: number
  lastAccessed?: string
}

interface LibraryGridProps {
  audiobooks: LibraryAudiobook[]
  isLoading?: boolean
}

export function LibraryGrid({ audiobooks, isLoading }: LibraryGridProps) {
  const [loadingDownload, setLoadingDownload] = useState<string | null>(null)
  const [loadingPlay, setLoadingPlay] = useState<string | null>(null)
  const [isPlayerOpen, setIsPlayerOpen] = useState(false)
  const [currentAudiobook, setCurrentAudiobook] = useState<LibraryAudiobook | null>(null)
  const [streamUrl, setStreamUrl] = useState<string>('')

  const handleDownload = async (e: React.MouseEvent, bookId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    setLoadingDownload(bookId)
    try {
      const response = await fetch(`/api/audiobooks/${bookId}/download`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Download failed')
      }
      
      const data = await response.json()
      
      // Fetch the file as blob to ensure proper download
      const fileResponse = await fetch(data.downloadUrl)
      if (!fileResponse.ok) {
        throw new Error('Failed to fetch file')
      }
      
      const blob = await fileResponse.blob()
      const blobUrl = URL.createObjectURL(blob)
      
      // Create download link with blob URL
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = data.filename
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      
      // Clean up
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download audiobook. Please try again.')
    } finally {
      setLoadingDownload(null)
    }
  }

  const handlePlay = async (e: React.MouseEvent, bookId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    setLoadingPlay(bookId)
    try {
      const response = await fetch(`/api/audiobooks/${bookId}/stream`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Stream failed')
      }
      
      const data = await response.json()
      
      // Find the audiobook details
      const audiobook = audiobooks.find(book => book.id === bookId)
      if (!audiobook) {
        throw new Error('Audiobook not found')
      }
      
      // Set up the audio player modal
      setCurrentAudiobook(audiobook)
      setStreamUrl(data.streamUrl)
      setIsPlayerOpen(true)
    } catch (error) {
      console.error('Stream error:', error)
      alert('Failed to play audiobook. Please try again.')
    } finally {
      setLoadingPlay(null)
    }
  }
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="overflow-hidden border-0 bg-white shadow-sm">
            <div className="aspect-square bg-gray-200 animate-pulse" />
            <CardContent className="p-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
              <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (audiobooks.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Book className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No audiobooks found</h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          Try adjusting your search or browse different categories to find what you&apos;re looking for.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {audiobooks.map((book) => (
        <Link key={book.id} href={`/audiobooks/${book.id}`}>
          <Card className="group overflow-hidden border-0 bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer">
          <div className="relative">
            {/* Cover Image */}
            <div className="aspect-[3/4] bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center overflow-hidden">
              {book.coverUrl ? (
                <Image
                  src={book.coverUrl}
                  alt={book.title}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover"
                  priority={false}
                />
              ) : (
                <Book className="h-12 w-12 text-blue-600" />
              )}
            </div>
            
            {/* Play button overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button 
                size="sm" 
                className="shadow-lg"
                onClick={(e) => handlePlay(e, book.id)}
                disabled={loadingPlay === book.id}
              >
                <Play className="h-4 w-4 mr-2" />
                {loadingPlay === book.id ? 'Loading...' : 'Play'}
              </Button>
            </div>
          </div>
          
          <CardContent className="p-3">
            {/* Categories */}
            <div className="flex flex-wrap gap-1 mb-1">
              {book.categories.slice(0, 3).map((category) => (
                <Badge key={category} variant="secondary" className="text-xs px-2 py-0.5 2xl:block hidden">
                  {category}
                </Badge>
              ))}
              {book.categories.slice(0, 2).map((category) => (
                <Badge key={`mobile-${category}`} variant="secondary" className="text-xs px-2 py-0.5 2xl:hidden block">
                  {category}
                </Badge>
              ))}
              {book.categories.length > 3 && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5 2xl:block hidden">
                  +{book.categories.length - 3}
                </Badge>
              )}
              {book.categories.length > 2 && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5 2xl:hidden block">
                  +{book.categories.length - 2}
                </Badge>
              )}
            </div>
            
            {/* Title and Author */}
            <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 text-sm leading-tight">
              {book.title}
            </h3>
            <p className="text-xs text-gray-600 mb-1">by {book.author}</p>
            
            {/* Purchase Date and Duration */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-600">{new Date(book.purchaseDate).toLocaleDateString()}</span>
              </div>
              {book.duration && (
                <span className="text-xs text-gray-500">{book.duration}</span>
              )}
            </div>
            
            {/* Description */}
            <p className="text-xs text-gray-500 line-clamp-2 mb-2">
              {book.description}
            </p>
            
            {/* Download and Play Buttons */}
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                className="flex-1 text-xs"
                onClick={(e) => handleDownload(e, book.id)}
                disabled={loadingDownload === book.id}
              >
                <Download className="h-3 w-3 mr-1" />
                {loadingDownload === book.id ? 'Downloading...' : 'Download'}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs"
                onClick={(e) => handlePlay(e, book.id)}
                disabled={loadingPlay === book.id}
              >
                <Play className="h-3 w-3" />
              </Button>
            </div>
            
            {/* Download Stats */}
            {book.downloadCount > 0 && (
              <div className="text-xs text-gray-400 mt-2">
                Downloaded {book.downloadCount} time{book.downloadCount !== 1 ? 's' : ''}
                {book.lastAccessed && (
                  <span className="block">
                    Last accessed {new Date(book.lastAccessed).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        </Link>
      ))}
      </div>
      
      {/* Audio Player Modal */}
      {currentAudiobook && (
        <AudioPlayerModal
          isOpen={isPlayerOpen}
          onClose={() => setIsPlayerOpen(false)}
          audiobook={{
            id: currentAudiobook.id,
            title: currentAudiobook.title,
            author: currentAudiobook.author,
            coverUrl: currentAudiobook.coverUrl
          }}
          streamUrl={streamUrl}
        />
      )}
    </>
  )
}