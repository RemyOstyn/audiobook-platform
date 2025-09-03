"use client"

import { useCallback, useState } from "react"
import { useDropzone, FileRejection } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Upload, X, FileAudio, AlertCircle, CheckCircle } from "lucide-react"
import { fileUploadSchema } from "@/lib/validators/audiobook"
import { toast } from "sonner"

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void
  onFileRemove: () => void
  file: File | null
  isUploading?: boolean
  uploadProgress?: number
  compact?: boolean
}

export function UploadDropzone({
  onFileSelect,
  onFileRemove,
  file,
  isUploading = false,
  uploadProgress = 0,
  compact = false
}: UploadDropzoneProps) {
  const [validationError, setValidationError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    setValidationError(null)
    
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0]
      setValidationError(error.message)
      toast.error(error.message)
      return
    }

    if (acceptedFiles.length === 0) {
      return
    }

    const selectedFile = acceptedFiles[0]
    
    // Validate with Zod
    const validation = fileUploadSchema.safeParse({ file: selectedFile })
    if (!validation.success) {
      const errorMessage = validation.error.issues[0].message
      setValidationError(errorMessage)
      toast.error(errorMessage)
      return
    }

    onFileSelect(selectedFile)
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/mpeg': ['.mp3'],
      'audio/mp4': ['.m4a'],
      'audio/aac': ['.aac'],
      'audio/x-m4a': ['.m4a'],
      'audio/m4b': ['.m4b']
    },
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024, // 500MB
    disabled: isUploading
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }


  if (file) {
    return (
      <Card>
        <CardContent className={compact ? "p-4" : "p-6"}>
          <div className={compact ? "space-y-2" : "space-y-4"}>
            {compact ? (
              // Compact layout
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-shrink-0">
                    {isUploading ? (
                      <div className="h-6 w-6 rounded-full bg-blue-50 flex items-center justify-center">
                        <Upload className="h-3 w-3 text-blue-600 animate-pulse" />
                      </div>
                    ) : uploadProgress === 100 ? (
                      <div className="h-6 w-6 rounded-full bg-green-50 flex items-center justify-center">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      </div>
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-gray-50 flex items-center justify-center">
                        <FileAudio className="h-3 w-3 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  {!isUploading && uploadProgress !== 100 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onFileRemove}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                {isUploading && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-1" />
                  </div>
                )}

                {uploadProgress === 100 && (
                  <div className="flex items-center space-x-1 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Complete</span>
                  </div>
                )}
              </div>
            ) : (
              // Full layout
              <>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {isUploading ? (
                        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                          <Upload className="h-5 w-5 text-blue-600 animate-pulse" />
                        </div>
                      ) : uploadProgress === 100 ? (
                        <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center">
                          <FileAudio className="h-5 w-5 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • {file.type || 'Audio file'}
                      </p>
                    </div>
                  </div>
                  {!isUploading && uploadProgress !== 100 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onFileRemove}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                {uploadProgress === 100 && (
                  <div className="flex items-center space-x-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Upload complete</span>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Upload className="h-6 w-6 text-gray-400" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Drop your audiobook here' : 'Upload audiobook file'}
              </p>
              <p className="text-sm text-gray-500">
                Drag and drop your audiobook, or click to browse
              </p>
              <p className="text-xs text-gray-400">
                Supports MP3, M4A, M4B, AAC • Max 500MB
              </p>
            </div>
            {!isDragActive && (
              <Button type="button" variant="outline" className="mt-4">
                Choose File
              </Button>
            )}
          </div>
        </div>
        
        {validationError && (
          <div className="mt-4 flex items-center space-x-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{validationError}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}