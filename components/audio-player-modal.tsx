"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Pause, Volume2, X } from 'lucide-react'
import Image from 'next/image'

interface AudioPlayerModalProps {
  isOpen: boolean
  onClose: () => void
  audiobook: {
    id: string
    title: string
    author: string
    coverUrl?: string
  }
  streamUrl: string
  isPreview?: boolean
  maxPlayTime?: number
}

export function AudioPlayerModal({
  isOpen,
  onClose,
  audiobook,
  streamUrl,
  isPreview = false,
  maxPlayTime = 0
}: AudioPlayerModalProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [previewEnded, setPreviewEnded] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => {
      setCurrentTime(audio.currentTime)
      
      // Check if preview time limit reached
      if (isPreview && maxPlayTime > 0 && audio.currentTime >= maxPlayTime) {
        audio.pause()
        setIsPlaying(false)
        setPreviewEnded(true)
      }
    }
    
    const updateDuration = () => {
      // For preview, show maxPlayTime as duration if it's less than actual duration
      if (isPreview && maxPlayTime > 0) {
        setDuration(Math.min(audio.duration, maxPlayTime))
      } else {
        setDuration(audio.duration)
      }
    }
    
    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', () => setIsPlaying(false))

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', () => setIsPlaying(false))
    }
  }, [streamUrl, isPreview, maxPlayTime])

  // Reset preview state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setPreviewEnded(false)
    }
  }, [isOpen])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    // Don't allow play if preview has ended
    if (previewEnded) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const time = parseFloat(e.target.value)
    // For preview, limit seeking to maxPlayTime
    const seekTime = isPreview && maxPlayTime > 0 ? Math.min(time, maxPlayTime) : time
    audio.currentTime = seekTime
    setCurrentTime(seekTime)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    const newVolume = parseFloat(e.target.value)
    
    setVolume(newVolume)
    if (audio) {
      audio.volume = newVolume
    }
  }

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center overflow-hidden">
              {audiobook.coverUrl ? (
                <Image
                  src={audiobook.coverUrl}
                  alt={audiobook.title}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl">🎧</span>
              )}
            </div>
            <div>
              <CardTitle className="text-lg line-clamp-1">{audiobook.title}</CardTitle>
              <p className="text-sm text-muted-foreground">by {audiobook.author}</p>
              {isPreview && (
                <p className="text-xs text-blue-600 font-medium">10-second preview</p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <audio
            ref={audioRef}
            src={streamUrl}
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={togglePlay}
              size="lg"
              className="w-16 h-16 rounded-full"
              disabled={previewEnded}
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-1" />
              )}
            </Button>
          </div>
          
          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          {/* Preview ended message */}
          {previewEnded && (
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 font-medium">
                Preview ended - Purchase to listen to the full audiobook
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}