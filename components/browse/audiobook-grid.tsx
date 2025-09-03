"use client"

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Book, ShoppingCart, Star } from 'lucide-react'

export interface Audiobook {
  id: string | number
  title: string
  author: string
  price: number
  coverUrl: string
  categories: string[]
  description: string
  rating?: number
  duration?: string
}

interface AudiobookGridProps {
  audiobooks: Audiobook[]
  isLoading?: boolean
}

export function AudiobookGrid({ audiobooks, isLoading }: AudiobookGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="overflow-hidden border-0 bg-white shadow-sm">
            <div className="aspect-[3/4] bg-gray-200 animate-pulse" />
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {audiobooks.map((book) => (
        <Link key={book.id} href={`/audiobooks/${book.id}`}>
          <Card className="group overflow-hidden border-0 bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer">
            <div className="relative">
            {/* Cover Image */}
            <div className="aspect-square bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center overflow-hidden">
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
            
            {/* Quick Add Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button size="sm" className="shadow-lg">
                <ShoppingCart className="h-4 w-4 mr-1" />
                Quick Add
              </Button>
            </div>
          </div>
          
          <CardContent className="p-4">
            {/* Categories */}
            <div className="flex flex-wrap gap-1 mb-2">
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
            <p className="text-xs text-gray-600 mb-2">by {book.author}</p>
            
            {/* Rating and Duration */}
            <div className="flex items-center gap-3 mb-3">
              {book.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  <span className="text-xs text-gray-600">{book.rating}</span>
                </div>
              )}
              {book.duration && (
                <span className="text-xs text-gray-500">{book.duration}</span>
              )}
            </div>
            
            {/* Description */}
            <p className="text-xs text-gray-500 line-clamp-4 mb-3">
              {book.description}
            </p>
            
            {/* Price and Add to Cart */}
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-gray-900">${book.price}</span>
              </div>
              <Button size="sm" variant="outline" className="text-xs">
                Add to Cart
              </Button>
            </div>
          </CardContent>
        </Card>
        </Link>
      ))}
    </div>
  )
}