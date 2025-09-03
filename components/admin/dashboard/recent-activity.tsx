"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Book, 
  Activity
} from 'lucide-react'
import { AdminStats } from '@/lib/types/admin'
import { formatDistanceToNow } from 'date-fns'

interface RecentActivityProps {
  stats: AdminStats | null
  isLoading?: boolean
}

export function RecentActivity({ stats, isLoading }: RecentActivityProps) {
  if (isLoading || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest system activity and events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
                <div className="space-y-1 flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasActivity = stats.recentActivity.audiobooks.length > 0 || 
                     stats.recentActivity.processingJobs.length > 0

  if (!hasActivity) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest system activity and events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-sm text-muted-foreground">
              No recent activity to display
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Combine all recent activity into a single list, limited to 5 items
  const allActivity = [
    ...stats.recentActivity.audiobooks.map(audiobook => ({
      id: audiobook.id,
      type: 'audiobook' as const,
      title: audiobook.title,
      subtitle: `by ${audiobook.author}`,
      status: audiobook.status,
      createdAt: audiobook.created_at,
      icon: Book
    })),
    ...stats.recentActivity.processingJobs.map(job => ({
      id: job.id,
      type: 'processing' as const,
      title: `${job.job_type ? job.job_type.charAt(0).toUpperCase() + job.job_type.slice(1) : 'Processing'} Job`,
      subtitle: job.audiobook?.title || 'Unknown audiobook',
      status: job.status,
      createdAt: job.created_at,
      icon: Activity
    }))
  ]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <p className="text-sm text-muted-foreground">Latest system events</p>
      </div>
      
      <div className="space-y-3">
        {allActivity.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            No recent activity
          </div>
        ) : (
          allActivity.map((item) => {
            const Icon = item.icon
            return (
              <div key={`${item.type}-${item.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  item.type === 'audiobook' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : 'Unknown'}
                  </span>
                  {item.type === 'audiobook' ? (
                    <StatusBadge status={item.status} />
                  ) : (
                    <ProcessingStatusBadge status={item.status} />
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
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
    <Badge variant={variants[status as keyof typeof variants] || 'outline'} className="text-xs">
      {labels[status as keyof typeof labels] || status}
    </Badge>
  )
}

function ProcessingStatusBadge({ status }: { status: string }) {
  const variants = {
    pending: 'secondary' as const,
    processing: 'default' as const,
    downloading: 'default' as const,
    chunking: 'default' as const,
    transcribing: 'default' as const,
    generating_content: 'default' as const,
    completed: 'outline' as const,
    failed: 'destructive' as const
  }

  const labels = {
    pending: 'Pending',
    processing: 'Processing',
    downloading: 'Downloading',
    chunking: 'Chunking',
    transcribing: 'Transcribing',
    generating_content: 'Generating',
    completed: 'Completed',
    failed: 'Failed'
  }

  return (
    <Badge variant={variants[status as keyof typeof variants] || 'outline'} className="text-xs">
      {labels[status as keyof typeof labels] || status}
    </Badge>
  )
}

