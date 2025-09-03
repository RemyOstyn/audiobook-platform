"use client"

import { Button } from '@/components/ui/button'
import { 
  Search,
  Book,
  Download,
  User
} from 'lucide-react'
import Link from 'next/link'

export function QuickActions() {
  const actions = [
    {
      id: "browse",
      title: "Browse",
      description: "Discover books",
      icon: Search,
      href: "/browse",
      primary: true
    },
    {
      id: "library",
      title: "My Library",
      description: "Your purchases",
      icon: Book,
      href: "/dashboard/history"
    },
    {
      id: "downloads",
      title: "Downloads",
      description: "Get files",
      icon: Download,
      href: "/dashboard/history?tab=downloads"
    },
    {
      id: "account",
      title: "Account",
      description: "Settings",
      icon: User,
      href: "/dashboard/account"
    }
  ]

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">Quick Actions</h3>
        <p className="text-xs text-gray-500">Common tasks and shortcuts</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.id} href={action.href}>
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