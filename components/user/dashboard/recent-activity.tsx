"use client"

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { 
  Book, 
  CheckCircle
} from 'lucide-react'
import { UserStats } from '@/lib/types/user'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface RecentActivityProps {
  stats: UserStats | null
  isLoading?: boolean
}

export function RecentActivity({ stats, isLoading }: RecentActivityProps) {
  if (isLoading || !stats) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Your latest listening sessions</p>
        </div>
        
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50">
              <div className="h-12 w-12 bg-gray-200 rounded-lg animate-pulse" />
              <div className="space-y-1 flex-1">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const hasActivity = stats.recentActivity.purchases.length > 0

  if (!hasActivity) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Your latest purchases and downloads</p>
        </div>
        
        <div className="text-center py-8 rounded-lg bg-gray-50">
          <Book className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <h4 className="text-sm font-medium text-gray-900 mb-1">No recent purchases</h4>
          <p className="text-xs text-muted-foreground mb-4">
            Purchase audiobooks to see your activity here
          </p>
          <Link href="/browse">
            <Button size="sm" variant="outline">
              Browse Audiobooks
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Get latest 5 purchases
  const recentPurchases = stats.recentActivity.purchases
    .sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <p className="text-sm text-muted-foreground">Your latest purchases and downloads</p>
      </div>
      
      <div className="space-y-3">
        {recentPurchases.map((purchase) => {
          return (
            <div key={purchase.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {purchase.audiobook.coverImageUrl ? (
                  <Image
                    src={purchase.audiobook.coverImageUrl}
                    alt={purchase.audiobook.title}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : (
                  <Book className="h-6 w-6 text-blue-600" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{purchase.audiobook.title}</p>
                <p className="text-xs text-muted-foreground truncate">by {purchase.audiobook.author}</p>
                <p className="text-xs text-muted-foreground">
                  Order #{purchase.orderNumber}
                </p>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(purchase.purchasedAt), { addSuffix: true })}
                </span>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-green-600">
                    ${purchase.price.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {stats.recentActivity.purchases.length > 5 && (
        <div className="text-center pt-2">
          <Link href="/dashboard/history">
            <Button variant="ghost" size="sm" className="text-xs">
              View all purchases
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}