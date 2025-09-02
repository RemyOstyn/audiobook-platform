import { AudiobookStatus } from '@prisma/client'

export interface AudiobookStats {
  total: number
  active: number
  processing: number
  draft: number
  inactive: number
}

export interface UserStats {
  total: number
  admin: number
  users: number
  recentSignups: number
}

export interface ProcessingStats {
  pending: number
  processing: number
  completed: number
  failed: number
}

export interface StorageStats {
  totalBytes: number
  totalGB: number
}

export interface RecentAudiobook {
  id: string
  title: string
  author: string
  status: string
  created_at: string
  created_by: string | null
}

export interface RecentProcessingJob {
  id: string
  job_type: string
  status: string
  created_at: string
  audiobook: {
    title: string
  } | null
}

export interface RecentActivity {
  audiobooks: RecentAudiobook[]
  processingJobs: RecentProcessingJob[]
}

export interface AdminStats {
  audiobooks: AudiobookStats
  users: UserStats
  processing: ProcessingStats
  storage: StorageStats
  recentActivity: RecentActivity
}

export interface AudiobookWhereClause {
  status?: AudiobookStatus
  OR?: Array<{
    title?: {
      contains: string
      mode: 'insensitive'
    }
    author?: {
      contains: string
      mode: 'insensitive'
    }
  }>
}