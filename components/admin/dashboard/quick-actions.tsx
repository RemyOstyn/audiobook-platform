"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Upload,
  Book,
  Users,
  Activity,
  ListMusic
} from 'lucide-react'
import Link from 'next/link'

export function QuickActions() {
  const actions = [
    {
      title: "Upload Audiobook",
      description: "Add a new audiobook to the platform",
      icon: Upload,
      href: "/admin/audiobooks/new",
      primary: true
    },
    {
      title: "Manage Audiobooks",
      description: "View and edit all audiobooks",
      icon: Book,
      href: "/admin/audiobooks"
    },
    {
      title: "View Processing Queue",
      description: "Monitor AI processing jobs",
      icon: Activity,
      href: "/admin/processing"
    },
    {
      title: "Manage Users",
      description: "View and manage user accounts",
      icon: Users,
      href: "/admin/users"
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common administrative tasks</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.href} href={action.href}>
              <Button
                variant={action.primary ? "default" : "ghost"}
                className="w-full justify-start h-auto p-4"
              >
                <div className="flex items-center gap-3 w-full">
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-sm opacity-70">{action.description}</div>
                  </div>
                </div>
              </Button>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}

export function SystemOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListMusic className="h-5 w-5" />
          System Overview
        </CardTitle>
        <CardDescription>Current system status and health</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Database</span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full" />
            <span className="text-sm text-muted-foreground">Connected</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Storage</span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full" />
            <span className="text-sm text-muted-foreground">Available</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">AI Processing</span>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-yellow-500 rounded-full" />
            <span className="text-sm text-muted-foreground">Phase 3</span>
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            🎯 <strong>Phase 2 Progress:</strong> Admin dashboard with real-time statistics complete. 
            Upload interface and audiobook management coming next.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}