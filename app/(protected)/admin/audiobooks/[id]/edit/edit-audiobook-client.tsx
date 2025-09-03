"use client"

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ArrowLeft, Upload, X, Save, Eye, Book } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { z } from 'zod'

const audioBookStatusSchema = z.enum(['draft', 'processing', 'active', 'inactive'])

const editAudiobookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  narrator: z.string().optional(),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  status: audioBookStatusSchema,
  cover_image_url: z.string().optional(),
  isbn: z.string().optional(),
  publication_year: z.number().optional(),
})

type EditAudiobookForm = z.infer<typeof editAudiobookSchema>
type AudioBookStatus = z.infer<typeof audioBookStatusSchema>

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

interface EditAudiobookClientProps {
  audiobook: Audiobook
}

export function EditAudiobookClient({ audiobook }: EditAudiobookClientProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch
  } = useForm<EditAudiobookForm>({
    resolver: zodResolver(editAudiobookSchema),
    defaultValues: {
      title: audiobook.title,
      author: audiobook.author,
      narrator: audiobook.narrator || '',
      description: audiobook.description || '',
      price: audiobook.price,
      status: audiobook.status as AudioBookStatus,
      cover_image_url: audiobook.cover_image_url || '',
      isbn: audiobook.isbn || '',
      publication_year: audiobook.publication_year,
    }
  })

  // Check if anything has changed (form fields or cover image)
  const hasChanges = isDirty || coverImageFile !== null

  const watchedStatus = watch('status')

  const handleCoverImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      
      setCoverImageFile(file)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCoverImageClick = () => {
    fileInputRef.current?.click()
  }

  const removeCoverImage = () => {
    setCoverImageFile(null)
    setCoverImagePreview(null)
    setValue('cover_image_url', '')
  }

  const uploadCoverImage = async (): Promise<string | null> => {
    if (!coverImageFile) return null

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', coverImageFile)

      const response = await fetch('/api/admin/upload/cover', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload cover image')
      }

      const { url } = await response.json()
      return url
    } catch (error) {
      console.error('Cover upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload cover image')
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const onSubmit = async (data: EditAudiobookForm) => {
    try {
      setIsSaving(true)

      let coverImageUrl = data.cover_image_url

      // Upload new cover image if selected
      if (coverImageFile) {
        const uploadedUrl = await uploadCoverImage()
        if (uploadedUrl) {
          coverImageUrl = uploadedUrl
        } else {
          return // Upload failed, don't continue
        }
      }

      // Update audiobook
      const updateData = {
        ...data,
        cover_image_url: coverImageUrl?.trim() || undefined,
        narrator: data.narrator?.trim() || undefined,
        description: data.description?.trim() || undefined,
        isbn: data.isbn?.trim() || undefined,
      }

      const response = await fetch(`/api/admin/audiobooks/${audiobook.id}`, {
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

      toast.success('Audiobook updated successfully')
      router.push('/admin/audiobooks')
      router.refresh()

    } catch (error) {
      console.error('Update error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update audiobook')
    } finally {
      setIsSaving(false)
    }
  }

  const currentCoverUrl = coverImagePreview || audiobook.cover_image_url

  return (
    <div className="max-w-6xl mx-auto">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" asChild>
          <Link href="/admin/audiobooks">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Audiobooks
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/audiobooks/${audiobook.id}`}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-12 gap-8">
          {/* Left Column - Cover Image */}
          <div className="col-span-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cover Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cover Image Display */}
                <div className="space-y-4">
                  <div 
                    className="relative w-full aspect-[2/3] bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg overflow-hidden cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors group"
                    onClick={handleCoverImageClick}
                  >
                    {currentCoverUrl ? (
                      <>
                        <Image
                          src={currentCoverUrl}
                          alt={audiobook.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="text-white text-center">
                            <Upload className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm">Click to replace</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <Book className="h-16 w-16 mb-4" />
                        <p className="text-sm text-center px-4">
                          Click to upload cover image
                        </p>
                      </div>
                    )}
                    
                    {/* Remove button */}
                    {(currentCoverUrl || coverImageFile) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeCoverImage()
                        }}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                    className="hidden"
                  />

                  <div className="text-xs text-gray-500">
                    <p>• Recommended size: 400x600px (2:3 ratio)</p>
                    <p>• Maximum file size: 10MB</p>
                    <p>• Supported formats: JPG, PNG, WebP, GIF</p>
                  </div>

                  {/* Alternative URL Input */}
                  <div className="pt-4 border-t space-y-2">
                    <Label htmlFor="cover_image_url" className="text-sm">Or use image URL</Label>
                    <Input
                      id="cover_image_url"
                      type="url"
                      placeholder="https://example.com/cover.jpg"
                      {...register('cover_image_url')}
                      disabled={!!coverImageFile}
                    />
                    {errors.cover_image_url && (
                      <p className="text-xs text-red-600">{errors.cover_image_url.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Form Fields */}
          <div className="col-span-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Audiobook Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      {...register('title')}
                      placeholder="Enter audiobook title"
                    />
                    {errors.title && (
                      <p className="text-xs text-red-600">{errors.title.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="author">Author *</Label>
                    <Input
                      id="author"
                      {...register('author')}
                      placeholder="Enter author name"
                    />
                    {errors.author && (
                      <p className="text-xs text-red-600">{errors.author.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="narrator">Narrator</Label>
                    <Input
                      id="narrator"
                      {...register('narrator')}
                      placeholder="Enter narrator name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (USD) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      max="999.99"
                      {...register('price', { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                    {errors.price && (
                      <p className="text-xs text-red-600">{errors.price.message}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Enter audiobook description"
                    rows={4}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-600">{errors.description.message}</p>
                  )}
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={watchedStatus} onValueChange={(value) => setValue('status', value as AudioBookStatus)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">Draft</Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="processing">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">Processing</Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="active">
                          <div className="flex items-center space-x-2">
                            <Badge variant="default" className="text-xs">Active</Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="inactive">
                          <div className="flex items-center space-x-2">
                            <Badge variant="destructive" className="text-xs">Inactive</Badge>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="publication_year">Publication Year</Label>
                    <Input
                      id="publication_year"
                      type="number"
                      min="1000"
                      max={new Date().getFullYear()}
                      {...register('publication_year', { 
                        valueAsNumber: true,
                        setValueAs: (value) => value === '' ? undefined : Number(value)
                      })}
                      placeholder="YYYY"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input
                      id="isbn"
                      {...register('isbn')}
                      placeholder="ISBN-13"
                      maxLength={13}
                    />
                  </div>
                </div>

                {/* File Information (Read-only) */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-sm mb-3">File Information</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">File Size</p>
                      <p className="font-medium">
                        {(audiobook.file_size_bytes / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    {audiobook.duration_seconds && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Duration</p>
                        <p className="font-medium">
                          {Math.floor(audiobook.duration_seconds / 3600)}h {Math.floor((audiobook.duration_seconds % 3600) / 60)}m
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Uploaded</p>
                      <p className="font-medium">
                        {new Date(audiobook.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={!hasChanges || isSaving || isUploading}
                    className="min-w-24"
                  >
                    {isSaving ? (
                      'Saving...'
                    ) : isUploading ? (
                      'Uploading...'
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}