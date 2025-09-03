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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Cover Image */}
            <div className="flex justify-center lg:justify-start">
              <Card className="overflow-hidden border-0 shadow-lg max-w-md w-full">
                <div className="aspect-[2/3] bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center overflow-hidden">
                  {audiobook.cover_image_url ? (
                    <Image
                      src={audiobook.cover_image_url}
                      alt={audiobook.title}
                      width={600}
                      height={900}
                      className="w-full h-full object-cover"
                      priority
                    />
                  ) : (
                    <Book className="h-24 w-24 text-blue-600" />
                  )}
                </div>
              </Card>
            </div>

            {/* Details */}
            <div className="space-y-6">
              {/* Categories */}
              <div className="flex flex-wrap gap-2">
                {audiobook.categories?.map((category: string) => (
                  <Badge key={category} variant="secondary" className="px-3 py-1">
                    {category}
                  </Badge>
                ))}
              </div>

              {/* Title and Author */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {audiobook.title}
                </h1>
                <p className="text-xl text-gray-600 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  by {audiobook.author}
                </p>
              </div>

              {/* Rating and Duration */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="text-lg text-gray-600">4.5</span>
                  <span className="text-gray-500">(124 reviews)</span>
                </div>
                {audiobook.duration_seconds && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <span className="text-gray-600">
                      {formatDuration(audiobook.duration_seconds)}
                    </span>
                  </div>
                )}
              </div>

              {/* Price and Actions */}
              <Card className="border-0 bg-white/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-900">
                        ${parseFloat(audiobook.price).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <Button size="lg" className="px-8">
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Add to Cart
                      </Button>
                      <Button size="lg" variant="outline">
                        Preview
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  About This Audiobook
                </h2>
                <Card className="border-0 bg-white/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <p className="text-gray-700 leading-relaxed">
                      {audiobook.description || 'No description available.'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Details */}
              <Card className="border-0 bg-white/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Format</span>
                      <p className="text-gray-900">Digital Audiobook</p>
                    </div>
                    {audiobook.duration_seconds && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Duration</span>
                        <p className="text-gray-900">
                          {formatDuration(audiobook.duration_seconds)}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium text-gray-500">Language</span>
                      <p className="text-gray-900">English</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Release Date</span>
                      <p className="text-gray-900">
                        {new Date(audiobook.created_at).toLocaleDateString()}
                      </p>
                    </div>
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