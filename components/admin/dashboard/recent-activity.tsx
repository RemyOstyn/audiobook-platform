"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Book, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest system activity and events</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="audiobooks" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="audiobooks">
              Audiobooks ({stats.recentActivity.audiobooks.length})
            </TabsTrigger>
            <TabsTrigger value="processing">
              Processing ({stats.recentActivity.processingJobs.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="audiobooks" className="space-y-4">
            {stats.recentActivity.audiobooks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent audiobook uploads
              </p>
            ) : (
              stats.recentActivity.audiobooks.map((audiobook) => (
                <div key={audiobook.id} className="flex items-center space-x-4">
                  <Book className="h-8 w-8 text-blue-600 bg-blue-50 p-1.5 rounded-full" />
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none truncate">
                      {audiobook.title}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      by {audiobook.author}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(audiobook.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={audiobook.status} />
                  </div>
                </div>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="processing" className="space-y-4">
            {stats.recentActivity.processingJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent processing jobs
              </p>
            ) : (
              stats.recentActivity.processingJobs.map((job) => (
                <div key={job.id} className="flex items-center space-x-4">
                  <ProcessingIcon status={job.status} />
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none">
                      {job.job_type.charAt(0).toUpperCase() + job.job_type.slice(1)} Job
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {job.audiobook?.title || 'Unknown audiobook'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ProcessingStatusBadge status={job.status} />
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
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
    <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
      {labels[status as keyof typeof labels] || status}
    </Badge>
  )
}

function ProcessingStatusBadge({ status }: { status: string }) {
  const variants = {
    pending: 'secondary' as const,
    processing: 'default' as const,
    completed: 'outline' as const,
    failed: 'destructive' as const
  }

  const labels = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed'
  }

  return (
    <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
      {labels[status as keyof typeof labels] || status}
    </Badge>
  )
}

function ProcessingIcon({ status }: { status: string }) {
  const icons = {
    pending: Clock,
    processing: Activity,
    completed: CheckCircle,
    failed: XCircle
  }

  const colors = {
    pending: 'text-yellow-600 bg-yellow-50',
    processing: 'text-blue-600 bg-blue-50',
    completed: 'text-green-600 bg-green-50',
    failed: 'text-red-600 bg-red-50'
  }

  const Icon = icons[status as keyof typeof icons] || AlertCircle
  const colorClass = colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-50'

  return <Icon className={`h-8 w-8 p-1.5 rounded-full ${colorClass}`} />
}