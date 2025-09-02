"use client"

import { useState, useEffect } from 'react'
import { StatsCards, ProcessingStatusCards } from '@/components/admin/dashboard/stats-cards'
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

  useEffect(() => {
    async function fetchStats() {
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
    }

    fetchStats()
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    
    return () => clearInterval(interval)
  }, [])

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.displayName || user.email}
          </p>
        </div>
        {stats && !isLoading && (
          <div className="text-xs text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Main Statistics Cards */}
      <StatsCards stats={stats} isLoading={isLoading} />
      
      {/* Processing Status Overview */}
      {(stats?.processing || isLoading) && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Processing Status</h2>
          <ProcessingStatusCards stats={stats} isLoading={isLoading} />
        </div>
      )}
      
      {/* Bottom Grid - Activity and Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-1 lg:col-span-2">
          <RecentActivity stats={stats} isLoading={isLoading} />
        </div>
        <div className="space-y-6">
          <QuickActions />
          <SystemOverview />
        </div>
      </div>
    </div>
  )
}