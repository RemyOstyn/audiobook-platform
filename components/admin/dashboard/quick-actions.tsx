"use client"

import { Button } from '@/components/ui/button'
import { 
  Upload,
  Book,
  Users,
  Activity
} from 'lucide-react'
import Link from 'next/link'

export function QuickActions() {
  const actions = [
    {
      title: "Upload",
      description: "Add new audiobook",
      icon: Upload,
      href: "/admin/audiobooks/new",
      primary: true
    },
    {
      title: "Audiobooks",
      description: "Manage content",
      icon: Book,
      href: "/admin/audiobooks"
    },
    {
      title: "Processing",
      description: "Monitor jobs",
      icon: Activity,
      href: "/admin/processing-jobs"
    },
    {
      title: "Users",
      description: "User management",
      icon: Users,
      href: "/admin/users"
    }
  ]

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">Quick Actions</h3>
        <p className="text-xs text-gray-500">Common administrative tasks</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.href} href={action.href}>
              <Button
                variant={action.primary ? "default" : "outline"}
                size="sm"
                className="h-auto p-3 flex flex-col items-center gap-1 min-w-[80px]"
              >
                <Icon className="h-4 w-4" />
                <div className="text-center">
                  <div className="text-xs font-medium leading-tight">{action.title}</div>
                  <div className="text-xs opacity-70 leading-tight">{action.description}</div>
                </div>
              </Button>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function SystemOverview() {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">System Status</h3>
        <p className="text-xs text-gray-500">Current system health</p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Database</span>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 bg-green-500 rounded-full" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Storage</span>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 bg-green-500 rounded-full" />
            <span className="text-xs text-muted-foreground">Available</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">AI Processing</span>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 bg-green-500 rounded-full" />
            <span className="text-xs text-muted-foreground">Ready</span>
          </div>
        </div>
      </div>
    </div>
  )
}