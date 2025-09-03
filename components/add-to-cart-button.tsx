'use client'

import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/lib/stores/cart-store'
import { useState } from 'react'
import { toast } from 'sonner'

interface AddToCartButtonProps {
  audiobook: {
    id: string
    title: string
    author: string
    price: number
    coverUrl: string
  }
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  className?: string
  showIcon?: boolean
  isOwned?: boolean
}

export function AddToCartButton({
  audiobook,
  size = 'default',
  variant = 'default',
  className,
  showIcon = true,
  isOwned = false
}: AddToCartButtonProps) {
  const { addItem, isLoading, isItemInCart } = useCartStore()
  const [isAdding, setIsAdding] = useState(false)
  
  const isInCart = isItemInCart(audiobook.id)
  
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isOwned) {
      toast.info('You already own this audiobook')
      return
    }
    
    if (isInCart) {
      toast.info('Item already in cart')
      return
    }
    
    setIsAdding(true)
    
    try {
      await addItem(audiobook)
      toast.success(`"${audiobook.title}" added to cart!`)
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add item to cart. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }
  
  const loading = isLoading || isAdding
  
  return (
    <Button
      onClick={handleAddToCart}
      disabled={loading || isInCart || isOwned}
      size={size}
      variant={isOwned || isInCart ? 'outline' : variant}
      className={className}
    >
      {showIcon && !isOwned && <ShoppingCart className="h-4 w-4 mr-2" />}
      {showIcon && isOwned && <span className="mr-2">✓</span>}
      {loading 
        ? 'Adding...' 
        : isOwned
          ? 'Already Owned'
          : isInCart 
            ? 'In Cart' 
            : size === 'sm' 
              ? 'Add' 
              : 'Add to Cart'
      }
    </Button>
  )
}