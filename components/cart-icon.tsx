'use client'

import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/lib/stores/cart-store'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export function CartIcon() {
  const { getTotalItems } = useCartStore()
  const [mounted, setMounted] = useState(false)
  
  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" asChild>
        <Link href="/cart">
          <div className="relative">
            <ShoppingCart className="h-5 w-5" />
          </div>
        </Link>
      </Button>
    )
  }
  
  const totalItems = getTotalItems()
  
  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href="/cart">
        <div className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalItems > 99 ? '99+' : totalItems}
            </Badge>
          )}
        </div>
      </Link>
    </Button>
  )
}