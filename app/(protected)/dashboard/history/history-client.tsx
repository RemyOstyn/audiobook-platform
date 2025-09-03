"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Receipt } from 'lucide-react'

interface HistoryClientProps {
  purchase: {
    id: string
    audiobookId: string
    title: string
  }
}

export function HistoryClient({ purchase }: HistoryClientProps) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/audiobooks/${purchase.audiobookId}/download`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Download failed')
      }
      
      const data = await response.json()
      
      // Fetch the file as blob to ensure proper download
      const fileResponse = await fetch(data.downloadUrl)
      if (!fileResponse.ok) {
        throw new Error('Failed to fetch file')
      }
      
      const blob = await fileResponse.blob()
      const blobUrl = URL.createObjectURL(blob)
      
      // Create download link with blob URL
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = data.filename
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      
      // Clean up
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download audiobook. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button 
        variant="ghost" 
        size="sm" 
        title={loading ? "Downloading..." : "Download audiobook"}
        onClick={handleDownload}
        disabled={loading}
      >
        <Download className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" title="View receipt">
        <Receipt className="h-4 w-4" />
      </Button>
    </div>
  )
}