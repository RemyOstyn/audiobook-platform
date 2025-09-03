"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Book, 
  Users, 
  Activity, 
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
      <div className="grid gap-6 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="border-0 bg-gradient-to-br from-gray-50 to-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-16" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-32" />
                </div>
                <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const hasActiveProcessing = (stats.processing.pending + stats.processing.processing) > 0
  const processingInfo = hasActiveProcessing 
    ? `${stats.processing.pending + stats.processing.processing} active jobs`
    : `${stats.processing.completed} completed, ${stats.processing.failed} failed`

  const cards = [
    {
      title: "Audiobooks",
      value: stats.audiobooks.total,
      subtitle: `${stats.audiobooks.active} published · ${stats.audiobooks.processing} processing`,
      icon: Book,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100",
      change: stats.users.recentSignups > 0 ? '+' + (stats.audiobooks.processing || 0) : undefined
    },
    {
      title: "Users",
      value: stats.users.total,
      subtitle: stats.users.recentSignups > 0 
        ? `+${stats.users.recentSignups} this week`
        : 'No new signups this week',
      icon: Users,
      gradient: "from-emerald-500 to-emerald-600",
      bgGradient: "from-emerald-50 to-emerald-100",
      change: stats.users.recentSignups > 0 ? '+' + stats.users.recentSignups : undefined
    },
    {
      title: "Processing",
      value: hasActiveProcessing ? (stats.processing.pending + stats.processing.processing) : stats.processing.completed,
      subtitle: processingInfo,
      icon: Activity,
      gradient: hasActiveProcessing ? "from-orange-500 to-orange-600" : "from-gray-500 to-gray-600",
      bgGradient: hasActiveProcessing ? "from-orange-50 to-orange-100" : "from-gray-50 to-gray-100",
      isActive: hasActiveProcessing
    }
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title} className={`border-0 bg-gradient-to-br ${card.bgGradient} transition-all hover:shadow-md`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    {card.change && (
                      <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                        {card.change}
                      </span>
                    )}
                    {card.isActive && (
                      <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full animate-pulse">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {typeof card.value === 'string' ? card.value : card.value.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-500">
                    {card.subtitle}
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-sm`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
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