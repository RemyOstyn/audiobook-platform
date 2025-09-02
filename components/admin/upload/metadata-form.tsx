"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MetadataForm, metadataFormSchema } from "@/lib/validators/audiobook"
import { Upload, DollarSign } from "lucide-react"

interface MetadataFormProps {
  onSubmit: (data: MetadataForm & { coverImageUrl?: string }) => void
  isSubmitting?: boolean
  defaultValues?: Partial<MetadataForm & { coverImageUrl?: string }>
}

export function AudiobookMetadataForm({
  onSubmit,
  isSubmitting = false,
  defaultValues = {}
}: MetadataFormProps) {
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

  const handleFormSubmit = (data: MetadataForm) => {
    onSubmit({
      ...data,
      coverImageUrl: data.coverImageUrl?.trim() || undefined
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="h-5 w-5" />
          <span>Audiobook Details</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter audiobook title"
              {...register("title")}
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Author */}
          <div className="space-y-2">
            <Label htmlFor="author">Author *</Label>
            <Input
              id="author"
              placeholder="Enter author name"
              {...register("author")}
              disabled={isSubmitting}
            />
            {errors.author && (
              <p className="text-sm text-red-600">{errors.author.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter audiobook description (optional)"
              rows={4}
              {...register("description")}
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
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

          {/* Cover Image URL (optional) */}
          <div className="space-y-2">
            <Label htmlFor="coverImageUrl">Cover Image URL</Label>
            <Input
              id="coverImageUrl"
              type="url"
              placeholder="https://example.com/cover.jpg (optional)"
              {...register("coverImageUrl")}
              disabled={isSubmitting}
            />
            {errors.coverImageUrl && (
              <p className="text-sm text-red-600">{errors.coverImageUrl.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Optional: URL to an existing cover image. Leave empty to use default cover.
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