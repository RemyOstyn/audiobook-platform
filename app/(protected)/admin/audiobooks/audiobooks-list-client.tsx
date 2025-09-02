"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Search, 
  Book,
  Clock,
  DollarSign,
  Calendar,
  User
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface Audiobook {
  id: string
  title: string
  author: string
  description?: string
  price: number
  status: string
  cover_image_url?: string
  file_name: string
  file_size_bytes: number
  duration_minutes?: number
  uploaded_by: string
  created_at: string
  updated_at: string
}

interface AudiobooksResponse {
  audiobooks: Audiobook[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export function AudiobooksListClient() {
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<AudiobooksResponse['pagination'] | null>(null)

  const fetchAudiobooks = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      if (statusFilter) {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/admin/audiobooks?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch audiobooks')
      }

      const data: AudiobooksResponse = await response.json()
      setAudiobooks(data.audiobooks)
      setPagination(data.pagination)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load audiobooks'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [page, searchTerm, statusFilter])

  useEffect(() => {
    fetchAudiobooks()
  }, [fetchAudiobooks])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1)
      else fetchAudiobooks()
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm, page, fetchAudiobooks])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default' as const,
      processing: 'secondary' as const,
      draft: 'outline' as const,
      inactive: 'destructive' as const
    }

    const labels = {
      active: 'Active',
      processing: 'Processing',
      draft: 'Draft',
      inactive: 'Inactive'
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  if (error && audiobooks.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <div className="text-4xl">⚠️</div>
            <h3 className="text-lg font-semibold">Failed to load audiobooks</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={fetchAudiobooks} size="sm">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search audiobooks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="">All Status</option>
            <option value="processing">Processing</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <Button asChild>
          <Link href="/admin/audiobooks/new">
            <Plus className="h-4 w-4 mr-2" />
            Upload Audiobook
          </Link>
        </Button>
      </div>

      {/* Audiobooks List */}
      {isLoading && audiobooks.length === 0 ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-5 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                    </div>
                    <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="h-4 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : audiobooks.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="text-4xl">📚</div>
              <h3 className="text-lg font-semibold">No audiobooks found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || statusFilter ? 
                  'Try adjusting your search or filter criteria' : 
                  'Get started by uploading your first audiobook'}
              </p>
              <Button asChild>
                <Link href="/admin/audiobooks/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Your First Audiobook
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {audiobooks.map((audiobook) => (
            <Card key={audiobook.id}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <h3 className="text-lg font-semibold truncate">
                        {audiobook.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        by {audiobook.author}
                      </p>
                      {audiobook.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {audiobook.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0">
                      {getStatusBadge(audiobook.status)}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4" />
                      <span>${audiobook.price.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Book className="h-4 w-4" />
                      <span>{formatFileSize(audiobook.file_size_bytes)}</span>
                    </div>
                    {audiobook.duration_minutes && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>{Math.round(audiobook.duration_minutes)} min</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{audiobook.uploaded_by}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Uploaded {formatDistanceToNow(new Date(audiobook.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <span className="font-medium">
                      {audiobook.file_name}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
            {pagination.totalCount} audiobooks
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={!pagination.hasPrevPage}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={!pagination.hasNextPage}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}