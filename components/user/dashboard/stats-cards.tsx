"use client"

import { Card, CardContent } from '@/components/ui/card'
import { 
  Book, 
  Clock, 
  TrendingUp
} from 'lucide-react'
import { UserStats } from '@/lib/types/user'
import { formatDistanceToNow } from 'date-fns'

interface StatsCardsProps {
  stats: UserStats | null
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

  const cards = [
    {
      title: "Library",
      value: stats.library.totalPurchased,
      subtitle: stats.library.totalPurchased > 0 
        ? `${stats.library.totalPurchased} audiobooks owned`
        : 'No purchases yet',
      icon: Book,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100",
    },
    {
      title: "Total Spent",
      value: `$${stats.purchases.totalAmount.toFixed(2)}`,
      subtitle: stats.purchases.orderCount > 0
        ? `${stats.purchases.orderCount} orders placed`
        : 'No orders yet',
      icon: Clock,
      gradient: "from-emerald-500 to-emerald-600",
      bgGradient: "from-emerald-50 to-emerald-100",
    },
    {
      title: "Recent Activity",
      value: stats.activity.recentDownloads,
      subtitle: stats.activity.lastPurchase
        ? `Last purchase ${formatDistanceToNow(new Date(stats.activity.lastPurchase + 'Z'), { addSuffix: true })}`
        : 'No recent activity',
      icon: TrendingUp,
      gradient: "from-orange-500 to-orange-600",
      bgGradient: "from-orange-50 to-orange-100",
      isActive: stats.activity.recentDownloads > 0
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
                    {'isActive' in card && card.isActive && (
                      <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
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