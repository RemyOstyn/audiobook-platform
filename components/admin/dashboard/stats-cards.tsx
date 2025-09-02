"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Book, 
  Users, 
  Activity, 
  HardDrive,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { AdminStats } from '@/lib/types/admin'

interface StatsCardsProps {
  stats: AdminStats | null
  isLoading?: boolean
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </CardTitle>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: "Total Audiobooks",
      value: stats.audiobooks.total,
      subtitle: `${stats.audiobooks.active} active, ${stats.audiobooks.processing} processing`,
      icon: Book,
      color: "text-blue-600"
    },
    {
      title: "Total Users",
      value: stats.users.total,
      subtitle: `${stats.users.recentSignups} new this week`,
      icon: Users,
      color: "text-green-600"
    },
    {
      title: "Processing Queue",
      value: stats.processing.pending + stats.processing.processing,
      subtitle: `${stats.processing.failed} failed jobs`,
      icon: Activity,
      color: "text-orange-600"
    },
    {
      title: "Storage Used",
      value: `${stats.storage.totalGB} GB`,
      subtitle: `${stats.audiobooks.total} files stored`,
      icon: HardDrive,
      color: "text-purple-600"
    }
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {typeof card.value === 'string' ? card.value : card.value.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {card.subtitle}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export function ProcessingStatusCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-6 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const processingCards = [
    {
      title: "Pending",
      value: stats.processing.pending,
      icon: Clock,
      color: "text-yellow-600"
    },
    {
      title: "Processing",
      value: stats.processing.processing,
      icon: Activity,
      color: "text-blue-600"
    },
    {
      title: "Completed",
      value: stats.processing.completed,
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      title: "Failed",
      value: stats.processing.failed,
      icon: AlertCircle,
      color: "text-red-600"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {processingCards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title} className="text-center">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-center gap-2">
                <Icon className={`h-4 w-4 ${card.color}`} />
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {card.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}