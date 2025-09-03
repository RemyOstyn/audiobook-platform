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
}

export function AddToCartButton({
  audiobook,
  size = 'default',
  variant = 'default',
  className,
  showIcon = true
}: AddToCartButtonProps) {
  const { addItem, isLoading, isItemInCart } = useCartStore()
  const [isAdding, setIsAdding] = useState(false)
  
  const isInCart = isItemInCart(audiobook.id)
  
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
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
      disabled={loading || isInCart}
      size={size}
      variant={isInCart ? 'outline' : variant}
      className={className}
    >
      {showIcon && <ShoppingCart className="h-4 w-4 mr-2" />}
      {loading 
        ? 'Adding...' 
        : isInCart 
          ? 'In Cart' 
          : size === 'sm' 
            ? 'Add' 
            : 'Add to Cart'
      }
    </Button>
  )
}