"use client"

import { useState, useEffect, useCallback } from 'react'
import { StatsCards } from '@/components/admin/dashboard/stats-cards'
import { RecentActivity } from '@/components/admin/dashboard/recent-activity'
import { QuickActions, SystemOverview } from '@/components/admin/dashboard/quick-actions'
import { Card, CardContent } from '@/components/ui/card'
import { AdminStats } from '@/lib/types/admin'
import { toast } from 'sonner'

interface AdminDashboardProps {
  user: {
    email: string
    displayName?: string | null
  }
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/stats')
      
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
    
    // Refresh stats every 2 minutes - check for active jobs inside the interval
    const interval = setInterval(() => {
      fetchStats()
    }, 120000)
    
    return () => clearInterval(interval)
  }, [fetchStats])

  if (error && !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
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
      
      {/* Bottom Grid - Activity and System Status */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivity stats={stats} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-1">
          <SystemOverview />
        </div>
      </div>
    </div>
  )
}