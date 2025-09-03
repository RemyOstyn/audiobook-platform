"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  Search, 
  Book,
  Edit,
  Trash2,
  MoreVertical,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'

interface Audiobook {
  id: string
  title: string
  author: string
  narrator?: string
  description?: string
  price: number
  status: string
  cover_image_url?: string
  file_url: string
  file_size_bytes: number
  duration_seconds?: number
  isbn?: string
  publication_year?: number
  categories?: string[]
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
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set())

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


  const handleDelete = async (audiobook: Audiobook, hardDelete = false) => {
    if (!confirm(`Are you sure you want to ${hardDelete ? 'permanently delete' : 'deactivate'} "${audiobook.title}"?`)) {
      return
    }

    try {
      const url = hardDelete 
        ? `/api/admin/audiobooks/${audiobook.id}?hard=true`
        : `/api/admin/audiobooks/${audiobook.id}`

      const response = await fetch(url, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete audiobook')
      }

      if (hardDelete) {
        // Remove from list
        setAudiobooks(prev => prev.filter(book => book.id !== audiobook.id))
        toast.success('Audiobook permanently deleted')
      } else {
        // Update status to inactive
        setAudiobooks(prev => 
          prev.map(book => 
            book.id === audiobook.id 
              ? { ...book, status: 'inactive' }
              : book
          )
        )
        toast.success('Audiobook deactivated')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete audiobook'
      toast.error(errorMessage)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBooks(new Set(audiobooks.map(book => book.id)))
    } else {
      setSelectedBooks(new Set())
    }
  }

  const handleSelectBook = (bookId: string, checked: boolean) => {
    const newSelected = new Set(selectedBooks)
    if (checked) {
      newSelected.add(bookId)
    } else {
      newSelected.delete(bookId)
    }
    setSelectedBooks(newSelected)
  }

  const handleBulkStatusChange = async (status: string) => {
    const selectedIds = Array.from(selectedBooks)
    if (selectedIds.length === 0) return

    try {
      const promises = selectedIds.map(id => 
        fetch(`/api/admin/audiobooks/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        })
      )
      
      await Promise.all(promises)
      
      setAudiobooks(prev => 
        prev.map(book => 
          selectedIds.includes(book.id) ? { ...book, status } : book
        )
      )
      
      setSelectedBooks(new Set())
      toast.success(`Updated ${selectedIds.length} audiobooks`)
    } catch {
      toast.error('Failed to update audiobooks')
    }
  }

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
        <div className="flex items-center space-x-2">
          {selectedBooks.size > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{selectedBooks.size} selected</span>
              <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('active')}>Activate</Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('inactive')}>Deactivate</Button>
            </div>
          )}
          <Button asChild>
            <Link href="/admin/audiobooks/new">
              <Plus className="h-4 w-4 mr-2" />
              Upload Audiobook
            </Link>
          </Button>
        </div>
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
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedBooks.size === audiobooks.length && audiobooks.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-20"></TableHead>
                  <TableHead>Audiobook</TableHead>
                  <TableHead className="w-24">Price</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="w-24">Size</TableHead>
                  <TableHead className="w-32">Uploaded</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audiobooks.map((audiobook) => (
                  <TableRow key={audiobook.id} className="hover:bg-gray-50">
                    <TableCell>
                      <Checkbox
                        checked={selectedBooks.has(audiobook.id)}
                        onCheckedChange={(checked) => handleSelectBook(audiobook.id, !!checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="w-16 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded flex items-center justify-center overflow-hidden">
                        {audiobook.cover_image_url ? (
                          <Image
                            src={audiobook.cover_image_url}
                            alt={audiobook.title}
                            width={64}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Book className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-sm line-clamp-1">{audiobook.title}</h3>
                        <p className="text-xs text-gray-600">by {audiobook.author}</p>
                        {audiobook.duration_seconds && (
                          <p className="text-xs text-gray-500">
                            {Math.round(audiobook.duration_seconds / 60)} min
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">${audiobook.price.toFixed(2)}</span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(audiobook.status)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {formatFileSize(audiobook.file_size_bytes)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-600">
                        {formatDistanceToNow(new Date(audiobook.created_at), { addSuffix: true })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/audiobooks/${audiobook.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/admin/audiobooks/${audiobook.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleDelete(audiobook, false)}
                              className="text-orange-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(audiobook, true)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Permanently
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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