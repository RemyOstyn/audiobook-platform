'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { nanoid } from 'nanoid'

export interface CartItem {
  id: string
  audiobook: {
    id: string
    title: string
    author: string
    price: number
    coverUrl: string
  }
  quantity: number
  addedAt: Date
}

interface CartStore {
  items: CartItem[]
  isLoading: boolean
  sessionId: string | null
  
  // Actions
  addItem: (audiobook: { id: string; title: string; author: string; price: number; coverUrl: string }) => Promise<void>
  removeItem: (audioBookId: string) => Promise<void>
  clearCart: () => Promise<void>
  syncCart: () => Promise<void>
  initializeSessionId: () => void
  
  // Computed getters
  getTotalItems: () => number
  getTotalPrice: () => number
  isItemInCart: (audiobookId: string) => boolean
}

const generateSessionId = (): string => {
  return `guest_${nanoid()}`
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      sessionId: null,

      initializeSessionId: () => {
        const { sessionId } = get()
        if (!sessionId) {
          set({ sessionId: generateSessionId() })
        }
      },

      addItem: async (audiobook) => {
        set({ isLoading: true })
        
        try {
          const { items, sessionId } = get()
          
          // Initialize session ID if not present
          if (!sessionId) {
            get().initializeSessionId()
          }
          
          // Check if item already exists
          const existingItem = items.find(item => item.audiobook.id === audiobook.id)
          
          if (existingItem) {
            // Update quantity
            set({
              items: items.map(item =>
                item.audiobook.id === audiobook.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              )
            })
          } else {
            // Add new item
            const newItem: CartItem = {
              id: nanoid(),
              audiobook,
              quantity: 1,
              addedAt: new Date()
            }
            
            set({ items: [...items, newItem] })
          }
          
          // Sync with server
          await fetch('/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audiobookId: audiobook.id,
              sessionId: get().sessionId
            })
          })
        } catch (error) {
          console.error('Error adding item to cart:', error)
        } finally {
          set({ isLoading: false })
        }
      },

      removeItem: async (audiobookId) => {
        set({ isLoading: true })
        
        try {
          const { items } = get()
          
          set({
            items: items.filter(item => item.audiobook.id !== audiobookId)
          })
          
          // Sync with server
          await fetch(`/api/cart/remove/${audiobookId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: get().sessionId
            })
          })
        } catch (error) {
          console.error('Error removing item from cart:', error)
        } finally {
          set({ isLoading: false })
        }
      },

      clearCart: async () => {
        set({ isLoading: true })
        
        try {
          set({ items: [] })
          
          // Sync with server
          await fetch('/api/cart/clear', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: get().sessionId
            })
          })
        } catch (error) {
          console.error('Error clearing cart:', error)
        } finally {
          set({ isLoading: false })
        }
      },

      syncCart: async () => {
        set({ isLoading: true })
        
        try {
          const response = await fetch('/api/cart', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          })
          
          if (response.ok) {
            const serverCart = await response.json()
            set({ items: serverCart.items || [] })
          }
        } catch (error) {
          console.error('Error syncing cart:', error)
        } finally {
          set({ isLoading: false })
        }
      },

      getTotalItems: () => {
        const { items } = get()
        return items.reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPrice: () => {
        const { items } = get()
        return items.reduce((total, item) => total + (item.audiobook.price * item.quantity), 0)
      },

      isItemInCart: (audiobookId: string) => {
        const { items } = get()
        return items.some(item => item.audiobook.id === audiobookId)
      }
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        sessionId: state.sessionId
      }),
      skipHydration: false
    }
  )
)

// Initialize session ID on store creation
useCartStore.getState().initializeSessionId()