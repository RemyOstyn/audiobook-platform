"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  Search, 
  Book,
  Clock,
  DollarSign,
  Calendar,
  User,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

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
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingAudiobook, setEditingAudiobook] = useState<Audiobook | null>(null)
  const [editFormData, setEditFormData] = useState({
    title: '',
    author: '',
    narrator: '',
    description: '',
    price: 0,
    status: 'active',
    cover_image_url: '',
    isbn: '',
    publication_year: undefined as number | undefined,
    categories: [] as string[]
  })
  const [isSaving, setIsSaving] = useState(false)

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

  // Edit functions
  const openEditDialog = (audiobook: Audiobook) => {
    setEditingAudiobook(audiobook)
    setEditFormData({
      title: audiobook.title,
      author: audiobook.author,
      narrator: audiobook.narrator || '',
      description: audiobook.description || '',
      price: audiobook.price,
      status: audiobook.status,
      cover_image_url: audiobook.cover_image_url || '',
      isbn: audiobook.isbn || '',
      publication_year: audiobook.publication_year,
      categories: audiobook.categories || []
    })
    setEditDialogOpen(true)
  }

  const closeEditDialog = () => {
    setEditDialogOpen(false)
    setEditingAudiobook(null)
    setEditFormData({
      title: '',
      author: '',
      narrator: '',
      description: '',
      price: 0,
      status: 'active',
      cover_image_url: '',
      isbn: '',
      publication_year: undefined,
      categories: []
    })
  }

  const handleSaveEdit = async () => {
    if (!editingAudiobook) return

    try {
      setIsSaving(true)
      
      // Prepare data for API call
      const updateData = {
        title: editFormData.title.trim(),
        author: editFormData.author.trim(),
        narrator: editFormData.narrator.trim() || undefined,
        description: editFormData.description.trim() || undefined,
        price: editFormData.price,
        status: editFormData.status,
        cover_image_url: editFormData.cover_image_url.trim() || undefined,
        isbn: editFormData.isbn.trim() || undefined,
        publication_year: editFormData.publication_year,
        categories: editFormData.categories.filter(cat => cat.trim() !== '')
      }

      const response = await fetch(`/api/admin/audiobooks/${editingAudiobook.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update audiobook')
      }

      const data = await response.json()
      
      // Update the audiobook in the list
      setAudiobooks(prev => 
        prev.map(book => 
          book.id === editingAudiobook.id 
            ? { ...book, ...data.audiobook }
            : book
        )
      )

      toast.success('Audiobook updated successfully')
      closeEditDialog()

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update audiobook'
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(audiobook)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
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
                    {audiobook.duration_seconds && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>{Math.round(audiobook.duration_seconds / 60)} min</span>
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
                      ID: {audiobook.id.slice(0, 8)}...
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Audiobook</DialogTitle>
          </DialogHeader>
          
          {editingAudiobook && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title *</Label>
                  <Input
                    id="edit-title"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      title: e.target.value
                    }))}
                    placeholder="Audiobook title"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-author">Author *</Label>
                  <Input
                    id="edit-author"
                    value={editFormData.author}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      author: e.target.value
                    }))}
                    placeholder="Author name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-narrator">Narrator</Label>
                  <Input
                    id="edit-narrator"
                    value={editFormData.narrator}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      narrator: e.target.value
                    }))}
                    placeholder="Narrator name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Price *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    min="0"
                    max="999.99"
                    step="0.01"
                    value={editFormData.price}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      price: parseFloat(e.target.value) || 0
                    }))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  placeholder="Book description..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editFormData.status}
                    onValueChange={(value) => setEditFormData(prev => ({
                      ...prev,
                      status: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-publication-year">Publication Year</Label>
                  <Input
                    id="edit-publication-year"
                    type="number"
                    min="1000"
                    max={new Date().getFullYear()}
                    value={editFormData.publication_year || ''}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      publication_year: e.target.value ? parseInt(e.target.value) : undefined
                    }))}
                    placeholder="YYYY"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-isbn">ISBN</Label>
                  <Input
                    id="edit-isbn"
                    value={editFormData.isbn}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      isbn: e.target.value
                    }))}
                    placeholder="ISBN-13"
                    maxLength={13}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-cover">Cover Image URL</Label>
                  <Input
                    id="edit-cover"
                    type="url"
                    value={editFormData.cover_image_url}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      cover_image_url: e.target.value
                    }))}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={closeEditDialog}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={isSaving || !editFormData.title.trim() || !editFormData.author.trim()}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}