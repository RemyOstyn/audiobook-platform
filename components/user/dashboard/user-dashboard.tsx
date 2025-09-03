"use client"

import { useState, useEffect, useCallback } from 'react'
import { StatsCards } from '@/components/user/dashboard/stats-cards'
import { RecentActivity } from '@/components/user/dashboard/recent-activity'
import { QuickActions } from '@/components/user/dashboard/quick-actions'
import { Card, CardContent } from '@/components/ui/card'
import { UserStats } from '@/lib/types/user'
import { toast } from 'sonner'

interface UserDashboardProps {
  user: {
    id: string
    email: string
    displayName?: string | null
  }
}

export function UserDashboard({ user }: UserDashboardProps) {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/user/stats')
      
      if (!response.ok) {
        throw new Error('Failed to fetch statistics')
      }
      
      const data = await response.json()
      setStats(data)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (error && !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Library</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.displayName || user.email}
          </p>
        </div>
        
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <div className="text-4xl">⚠️</div>
              <h3 className="text-lg font-semibold">Failed to load dashboard</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="text-sm text-blue-600 hover:underline"
              >
                Try again
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Library</h1>
          <p className="text-sm text-gray-500">
            Welcome back, {user.displayName || user.email}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {stats && !isLoading && (
            <div className="text-xs text-gray-400">
              Updated {new Date().toLocaleTimeString()}
            </div>
          )}
          <button
            onClick={() => fetchStats()}
            disabled={isLoading}
            className="text-xs px-3 py-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Main Statistics Cards */}
      <StatsCards stats={stats} isLoading={isLoading} />

      {/* Quick Actions */}
      <QuickActions />
      
      {/* Bottom Grid - Activity */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivity stats={stats} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-1">
          {/* Placeholder for future features like recommendations */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Recommendations</h3>
              <p className="text-xs text-gray-500">Personalized suggestions</p>
            </div>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-gray-50 text-center">
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}