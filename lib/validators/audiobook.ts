import { z } from "zod"

export const audiobookUploadSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  author: z.string().min(1, "Author is required").max(100, "Author must be less than 100 characters"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be positive").max(999.99, "Price must be less than $999.99"),
  cover_image_url: z.string().url().optional(),
  duration_minutes: z.number().min(1, "Duration must be at least 1 minute").optional(),
  file_size_bytes: z.number().min(1, "File size is required"),
  file_name: z.string().min(1, "File name is required"),
  file_path: z.string().min(1, "File path is required"),
})

export const fileUploadSchema = z.object({
  file: z.instanceof(File, { message: "File is required" })
    .refine((file) => {
      const validTypes = ['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/x-m4a', 'audio/m4b']
      return validTypes.includes(file.type) || 
             file.name.toLowerCase().match(/\.(mp3|m4a|m4b|aac)$/)
    }, "File must be an audio file (MP3, M4A, M4B, or AAC)")
    .refine((file) => file.size <= 500 * 1024 * 1024, "File must be less than 500MB"),
})

export const metadataFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  author: z.string().min(1, "Author is required").max(100, "Author must be less than 100 characters"),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
  price: z.number().min(0, "Price must be positive").max(999.99, "Price must be less than $999.99"),
  coverImageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
})

export const presignedUrlRequestSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.number().min(1, "File size is required").max(500 * 1024 * 1024, "File must be less than 500MB"),
  contentType: z.string().min(1, "Content type is required")
    .refine((type) => {
      const validTypes = ['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/x-m4a', 'audio/m4b']
      return validTypes.includes(type)
    }, "Invalid audio file type"),
})

export const uploadCompleteSchema = z.object({
  filePath: z.string().min(1, "File path is required"),
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.number().min(1, "File size is required"),
  contentType: z.string().min(1, "Content type is required"),
  title: z.string().min(1, "Title is required").max(200),
  author: z.string().min(1, "Author is required").max(100),
  description: z.string().max(2000).optional(),
  price: z.number().min(0).max(999.99),
  coverImageUrl: z.string().url().optional(),
})

export type AudiobookUpload = z.infer<typeof audiobookUploadSchema>
export type FileUpload = z.infer<typeof fileUploadSchema>
export type MetadataForm = z.infer<typeof metadataFormSchema>
export type PresignedUrlRequest = z.infer<typeof presignedUrlRequestSchema>
export type UploadComplete = z.infer<typeof uploadCompleteSchema>