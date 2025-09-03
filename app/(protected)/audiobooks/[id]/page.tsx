import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Book, ShoppingCart, Star, Clock, User } from 'lucide-react'

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

export default async function AudiobookDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch the specific audiobook
  const { data: audiobook, error } = await supabase
    .from('audiobooks')
    .select('*')
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (error || !audiobook) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Main Content Grid */}
          <div className="grid grid-cols-12 gap-8 h-[calc(100vh-8rem)]">
            
            {/* Left Column - Cover Image + Purchase */}
            <div className="col-span-4 flex flex-col items-center justify-center space-y-6">
              <div className="w-full max-w-xs">
                <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl shadow-sm overflow-hidden border border-gray-200">
                  {audiobook.cover_image_url ? (
                    <Image
                      src={audiobook.cover_image_url}
                      alt={audiobook.title}
                      width={400}
                      height={533}
                      className="w-full h-full object-cover"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Book className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Price and Actions */}
              <div className="w-full max-w-xs">
                <div className="text-center mb-4">
                  <span className="text-3xl font-bold text-gray-900">
                    ${parseFloat(audiobook.price).toFixed(2)}
                  </span>
                </div>
                <div className="space-y-3">
                  <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button size="lg" variant="outline" className="w-full">
                    Preview
                  </Button>
                </div>
              </div>
            </div>

            {/* Middle Column - Main Info */}
            <div className="col-span-5 flex flex-col justify-center space-y-6">
              
              {/* Categories */}
              {audiobook.categories && audiobook.categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {audiobook.categories.map((category: string) => (
                    <Badge key={category} variant="outline" className="text-xs px-2 py-1">
                      {category}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Title and Author */}
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-3 leading-tight">
                  {audiobook.title}
                </h1>
                <p className="text-xl text-gray-600 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  by {audiobook.author}
                </p>
              </div>

              {/* Rating and Duration */}
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="text-lg font-medium text-gray-900">4.5</span>
                  <span className="text-gray-500">(124 reviews)</span>
                </div>
                {audiobook.duration_seconds && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <span className="text-gray-600 font-medium">
                      {formatDuration(audiobook.duration_seconds)}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="max-w-lg">
                <p className="text-gray-700 leading-relaxed text-sm">
                  {audiobook.description || 'No description available for this audiobook.'}
                </p>
              </div>
            </div>

            {/* Right Column - Additional Details */}
            <div className="col-span-3 flex flex-col justify-center">
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500 block mb-1">Format</span>
                      <p className="text-sm text-gray-900">Digital Audiobook</p>
                    </div>
                    {audiobook.duration_seconds && (
                      <div>
                        <span className="text-sm font-medium text-gray-500 block mb-1">Duration</span>
                        <p className="text-sm text-gray-900">
                          {formatDuration(audiobook.duration_seconds)}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium text-gray-500 block mb-1">Language</span>
                      <p className="text-sm text-gray-900">English</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500 block mb-1">Release Date</span>
                      <p className="text-sm text-gray-900">
                        {new Date(audiobook.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {audiobook.narrator && (
                      <div>
                        <span className="text-sm font-medium text-gray-500 block mb-1">Narrator</span>
                        <p className="text-sm text-gray-900">{audiobook.narrator}</p>
                      </div>
                    )}
                    {audiobook.isbn && (
                      <div>
                        <span className="text-sm font-medium text-gray-500 block mb-1">ISBN</span>
                        <p className="text-sm text-gray-900 font-mono">{audiobook.isbn}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}