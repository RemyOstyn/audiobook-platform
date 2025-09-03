export interface UserLibraryStats {
  totalPurchased: number
}

export interface PurchaseStats {
  totalAmount: number
  orderCount: number
}

export interface ActivityStats {
  recentDownloads: number
  lastPurchase?: string
}

export interface RecentPurchase {
  id: string
  audiobook: {
    id: string
    title: string
    author: string
    coverImageUrl?: string | null
  }
  price: number
  purchasedAt: string
  orderNumber: string
}

export interface UserRecentActivity {
  purchases: RecentPurchase[]
}

export interface UserStats {
  library: UserLibraryStats
  purchases: PurchaseStats
  activity: ActivityStats
  recentActivity: UserRecentActivity
}