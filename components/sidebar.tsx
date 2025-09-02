"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { UserMenu } from "@/components/user-menu"
import { ThemeSwitcher } from "@/components/theme-switcher"
import {
  Book,
  Settings,
  Menu,
  Library,
  History,
  User
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface SidebarProps {
  user: {
    email: string
    displayName?: string | null
  }
  userRole?: 'admin' | 'user'
}

const userNavItems = [
  {
    title: "My Library",
    href: "/dashboard",
    icon: Library
  },
  {
    title: "Browse",
    href: "/browse",
    icon: Book
  },
  {
    title: "Purchase History",
    href: "/dashboard/history",
    icon: History
  },
  {
    title: "Account",
    href: "/dashboard/account",
    icon: User
  }
]

const adminMenuItem = {
  title: "Admin",
  href: "/admin",
  icon: Settings
}

function SidebarContent({ user, userRole, className }: SidebarProps & { className?: string }) {
  const pathname = usePathname()
  
  // Always show user nav items, but add admin menu if user is admin
  const navItems = [...userNavItems]
  if (userRole === 'admin') {
    navItems.push(adminMenuItem)
  }
  
  const title = 'AudioBook Platform'

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Header */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center space-x-2">
          <div className="text-xl font-bold">{title}</div>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-2 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Button
                key={item.href}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive && "bg-secondary"
                )}
                asChild
              >
                <Link href={item.href}>
                  <Icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              </Button>
            )
          })}
        </div>
      </ScrollArea>

      <Separator />

      {/* User Section */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <UserMenu user={user} userRole={userRole} />
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  )
}

export function Sidebar({ user, userRole }: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex h-screen w-64 flex-col border-r bg-background">
        <SidebarContent user={user} userRole={userRole} />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-40">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent user={user} userRole={userRole} />
        </SheetContent>
      </Sheet>
    </>
  )
}