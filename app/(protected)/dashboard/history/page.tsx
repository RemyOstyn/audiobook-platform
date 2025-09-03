import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw } from 'lucide-react'
import Image from 'next/image'
import { HistoryClient } from './history-client'

interface Purchase {
  id: string
  order_number: string
  title: string
  author: string
  price: number
  createdAt: string
  status: string
  cover_image_url?: string | null
  audiobook_id: string
}

interface AudiobookData {
  id: string
  title: string
  author: string
  cover_image_url: string | null
}

interface OrderItemData {
  id: string
  price: string
  audiobook: AudiobookData
}

interface OrderData {
  id: string
  order_number: string
  total_amount: string
  status: string
  completed_at: string
  order_items: OrderItemData[]
}

export default async function PurchaseHistoryPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Fetch actual purchase history from database
  const { data: ordersData } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      total_amount,
      status,
      completed_at,
      order_items (
        id,
        price,
        audiobook:audiobooks (
          id,
          title,
          author,
          cover_image_url
        )
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })

  // Transform data for display
  const purchases: Purchase[] = (ordersData as unknown as OrderData[])?.flatMap(order => 
    (order.order_items || []).map(item => ({
      id: item.id,
      order_number: order.order_number,
      title: item.audiobook?.title || 'Unknown',
      author: item.audiobook?.author || 'Unknown',
      price: parseFloat(item.price),
      createdAt: order.completed_at || '',
      status: order.status,
      cover_image_url: item.audiobook?.cover_image_url,
      audiobook_id: item.audiobook?.id || ''
    }))
  ) || []

  // Calculate summary statistics
  const totalPurchases = purchases.length
  const totalSpent = ordersData?.reduce((sum, order) => 
    sum + parseFloat(order.total_amount), 0) || 0
  
  // Calculate this month's spending
  const thisMonth = new Date()
  const startOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1)
  const thisMonthOrders = ordersData?.filter(order => 
    new Date(order.completed_at || '') >= startOfMonth
  ) || []
  const thisMonthSpent = thisMonthOrders.reduce((sum, order) => 
    sum + parseFloat(order.total_amount), 0)
  const thisMonthCount = thisMonthOrders.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase History</h1>
          <p className="text-sm text-muted-foreground">
            View and manage your audiobook purchases
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPurchases}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${thisMonthSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{thisMonthCount} purchase{thisMonthCount !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>
      </div>

      {/* Purchase History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Purchases</CardTitle>
          <CardDescription>Your audiobook purchase history and downloads</CardDescription>
        </CardHeader>
        <CardContent>
          {purchases.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🛒</div>
              <h3 className="text-lg font-semibold mb-2">No purchases yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You haven&apos;t purchased any audiobooks yet. Browse our catalog to get started!
              </p>
              <Button asChild>
                <a href="/browse">Browse Audiobooks</a>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center overflow-hidden">
                      {purchase.cover_image_url ? (
                        <Image
                          src={purchase.cover_image_url}
                          alt={purchase.title}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg">📚</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">{purchase.title}</h4>
                      <p className="text-sm text-muted-foreground">by {purchase.author}</p>
                      <p className="text-xs text-muted-foreground">
                        Purchased on {new Date(purchase.createdAt).toLocaleDateString()} • Order #{purchase.order_number}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Completed
                    </Badge>
                    <span className="font-medium">${purchase.price.toFixed(2)}</span>
                    <HistoryClient 
                      purchase={{
                        id: purchase.id,
                        audiobookId: purchase.audiobook_id,
                        title: purchase.title
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters and Search - Placeholder for Phase 4 */}
      {purchases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Download History</CardTitle>
            <CardDescription>Track your audiobook downloads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                Download history will appear here when you start downloading audiobooks.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}