"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MetadataForm, metadataFormSchema } from "@/lib/validators/audiobook"
import { Upload, DollarSign, X } from "lucide-react"
import Image from "next/image"

interface MetadataFormProps {
  onSubmit: (data: MetadataForm & { coverImageUrl?: string, coverImageFile?: File }) => void
  isSubmitting?: boolean
  defaultValues?: Partial<MetadataForm & { coverImageUrl?: string }>
  compact?: boolean
}

export function AudiobookMetadataForm({
  onSubmit,
  isSubmitting = false,
  defaultValues = {},
  compact = false
}: MetadataFormProps) {
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch
  } = useForm<MetadataForm>({
    resolver: zodResolver(metadataFormSchema),
    defaultValues: {
      title: "",
      author: "",
      description: "",
      price: 9.99,
      coverImageUrl: "",
      ...defaultValues
    },
    mode: "onChange"
  })

  const title = watch("title")
  const author = watch("author")

  const handleCoverImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return
      }
      
      setCoverImageFile(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeCoverImage = () => {
    setCoverImageFile(null)
    setCoverImagePreview(null)
  }

  const handleFormSubmit = (data: MetadataForm) => {
    onSubmit({
      ...data,
      coverImageUrl: data.coverImageUrl?.trim() || undefined,
      coverImageFile: coverImageFile || undefined
    })
  }

  return (
    <Card>
      {!compact && (
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>Audiobook Details</span>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={compact ? "p-4" : "p-6"}>
        {compact && (
          <h3 className="text-sm font-medium mb-3">Audiobook Details</h3>
        )}
        <form onSubmit={handleSubmit(handleFormSubmit)} className={compact ? "space-y-3" : "space-y-6"}>
          {/* Title */}
          <div className={compact ? "space-y-1" : "space-y-2"}>
            <Label htmlFor="title" className={compact ? "text-xs" : undefined}>Title *</Label>
            <Input
              id="title"
              placeholder="Enter audiobook title"
              className={compact ? "text-sm" : undefined}
              {...register("title")}
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="text-xs text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Author */}
          <div className={compact ? "space-y-1" : "space-y-2"}>
            <Label htmlFor="author" className={compact ? "text-xs" : undefined}>Author *</Label>
            <Input
              id="author"
              placeholder="Enter author name"
              className={compact ? "text-sm" : undefined}
              {...register("author")}
              disabled={isSubmitting}
            />
            {errors.author && (
              <p className="text-xs text-red-600">{errors.author.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className={compact ? "text-xs" : undefined}>Description</Label>
            <Textarea
              id="description"
              placeholder="Enter audiobook description (optional)"
              rows={compact ? 2 : 4}
              className={compact ? "text-sm" : undefined}
              {...register("description")}
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price (USD) *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                max="999.99"
                placeholder="9.99"
                className="pl-10"
                {...register("price", { valueAsNumber: true })}
                disabled={isSubmitting}
              />
            </div>
            {errors.price && (
              <p className="text-sm text-red-600">{errors.price.message}</p>
            )}
          </div>

          {/* Cover Image Upload */}
          <div className="space-y-2">
            <Label>Cover Image</Label>
            
            {/* File Upload */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  disabled={isSubmitting}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              
              {/* Preview */}
              {coverImagePreview && (
                <div className="relative w-16 h-20 rounded border overflow-hidden">
                  <Image
                    src={coverImagePreview}
                    alt="Cover preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeCoverImage}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                    disabled={isSubmitting}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Alternative URL option */}
            <div className="pt-2 border-t">
              <Label htmlFor="coverImageUrl" className="text-sm text-gray-600">Or use image URL</Label>
              <Input
                id="coverImageUrl"
                type="url"
                placeholder="https://example.com/cover.jpg"
                {...register("coverImageUrl")}
                disabled={isSubmitting || !!coverImageFile}
                className="mt-1"
              />
              {errors.coverImageUrl && (
                <p className="text-sm text-red-600 mt-1">{errors.coverImageUrl.message}</p>
              )}
            </div>
            
            <p className="text-xs text-gray-500">
              Upload an image file or provide a URL. Recommended size: 400x600px (2:3 ratio)
            </p>
          </div>

          {/* Preview */}
          {(title || author) && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Preview</h4>
              <div className="bg-gray-50 rounded-lg p-3">
                <h5 className="font-medium text-gray-900">
                  {title || "Untitled Audiobook"}
                </h5>
                <p className="text-sm text-gray-600">
                  by {author || "Unknown Author"}
                </p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  ${watch("price")?.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="min-w-32"
            >
              {isSubmitting ? "Creating..." : "Create Audiobook"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}