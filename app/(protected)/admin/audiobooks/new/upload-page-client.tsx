"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadDropzone } from '@/components/admin/upload/upload-dropzone'
import { AudiobookMetadataForm } from '@/components/admin/upload/metadata-form'
import { MetadataForm } from '@/lib/validators/audiobook'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type UploadStep = 'file' | 'metadata' | 'uploading' | 'success'

export function UploadPageClient() {
  const router = useRouter()
  const [step, setStep] = useState<UploadStep>('file')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [createdAudiobook, setCreatedAudiobook] = useState<{ id: string; title: string } | null>(null)

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setStep('metadata')
  }

  const handleFileRemove = () => {
    setSelectedFile(null)
    setStep('file')
    setUploadProgress(0)
  }

  const handleMetadataSubmit = async (metadata: MetadataForm & { coverImageUrl?: string, coverImageFile?: File }) => {
    if (!selectedFile) {
      toast.error('No file selected')
      return
    }

    setStep('uploading')
    setIsProcessing(true)

    try {
      let coverImageUrl = metadata.coverImageUrl

      // Step 1: Upload cover image if provided
      if (metadata.coverImageFile) {
        const coverFormData = new FormData()
        coverFormData.append('file', metadata.coverImageFile)

        const coverResponse = await fetch('/api/admin/upload/cover', {
          method: 'POST',
          body: coverFormData
        })

        if (!coverResponse.ok) {
          const error = await coverResponse.json()
          throw new Error(error.error || 'Failed to upload cover image')
        }

        const { url } = await coverResponse.json()
        coverImageUrl = url
      }

      // Step 2: Get presigned URL for audiobook
      const presignedResponse = await fetch('/api/admin/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          contentType: selectedFile.type
        })
      })

      if (!presignedResponse.ok) {
        const error = await presignedResponse.json()
        throw new Error(error.error || 'Failed to get upload URL')
      }

      const { uploadUrl, filePath } = await presignedResponse.json()

      // Step 3: Upload audiobook file to Supabase Storage
      const uploadRequest = new XMLHttpRequest()
      
      uploadRequest.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(progress)
        }
      })

      uploadRequest.addEventListener('load', async () => {
        if (uploadRequest.status === 200) {
          try {
            // Step 4: Complete upload and create audiobook record
            const completeResponse = await fetch('/api/admin/upload/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                filePath,
                fileName: selectedFile.name,
                fileSize: selectedFile.size,
                contentType: selectedFile.type,
                title: metadata.title,
                author: metadata.author,
                description: metadata.description,
                price: metadata.price,
                coverImageUrl: coverImageUrl
              })
            })

            if (!completeResponse.ok) {
              const error = await completeResponse.json()
              throw new Error(error.error || 'Failed to create audiobook record')
            }

            const result = await completeResponse.json()
            setCreatedAudiobook(result.audiobook)
            setStep('success')
            toast.success('Audiobook uploaded successfully!')
          } catch (error) {
            console.error('Complete upload error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to create audiobook')
            setStep('metadata')
          }
        } else {
          toast.error('Failed to upload file to storage')
          setStep('metadata')
        }
        setIsProcessing(false)
      })

      uploadRequest.addEventListener('error', () => {
        toast.error('Upload failed')
        setStep('metadata')
        setIsProcessing(false)
      })

      uploadRequest.open('PUT', uploadUrl)
      uploadRequest.setRequestHeader('Content-Type', selectedFile.type)
      uploadRequest.send(selectedFile)

    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Upload failed')
      setStep('metadata')
      setIsProcessing(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 'file':
        return (
          <UploadDropzone
            file={selectedFile}
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
          />
        )

      case 'metadata':
        return (
          <div className="grid lg:grid-cols-5 gap-6">
            {/* File Upload - Left Column (Compact) */}
            <div className="lg:col-span-2">
              <UploadDropzone
                file={selectedFile}
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                compact={true}
              />
            </div>
            {/* Metadata Form - Right Column */}
            <div className="lg:col-span-3">
              <AudiobookMetadataForm
                onSubmit={handleMetadataSubmit}
                isSubmitting={isProcessing}
                compact={true}
              />
            </div>
          </div>
        )

      case 'uploading':
        return (
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Upload Progress - Left Column */}
            <div className="lg:col-span-2">
              <UploadDropzone
                file={selectedFile}
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                isUploading={true}
                uploadProgress={uploadProgress}
                compact={true}
              />
            </div>
            {/* Form - Right Column (Disabled during upload) */}
            <div className="lg:col-span-3">
              <AudiobookMetadataForm
                onSubmit={handleMetadataSubmit}
                isSubmitting={true}
                compact={true}
              />
            </div>
          </div>
        )

      case 'success':
        return (
          <div className="text-center py-12 space-y-4">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-600">Upload Successful!</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your audiobook &quot;{createdAudiobook?.title}&quot; has been uploaded and is now being processed.
            </p>
            <div className="flex justify-center space-x-3 pt-6">
              <Button onClick={() => router.push('/admin/audiobooks')}>
                View All Audiobooks
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setStep('file')
                  setSelectedFile(null)
                  setUploadProgress(0)
                  setCreatedAudiobook(null)
                }}
              >
                Upload Another
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Compact Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/audiobooks">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        {step !== 'success' && (
          <div className="flex items-center space-x-2 text-xs">
            <div className={`flex items-center space-x-1 ${step === 'file' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                ${step === 'file' ? 'bg-blue-600 text-white' : 
                  ['metadata', 'uploading'].includes(step) ? 'bg-green-600 text-white' : 
                  'bg-gray-200 text-gray-500'}`}>
                1
              </div>
              <span>File</span>
            </div>
            <div className="w-4 h-px bg-gray-300" />
            <div className={`flex items-center space-x-1 ${['metadata', 'uploading'].includes(step) ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                ${step === 'metadata' ? 'bg-blue-600 text-white' :
                  step === 'uploading' ? 'bg-green-600 text-white' :
                  'bg-gray-200 text-gray-500'}`}>
                2
              </div>
              <span>Details</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      {renderStep()}
    </div>
  )
}