import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, Receipt, RefreshCw } from 'lucide-react'

interface Purchase {
  id: string
  title: string
  author: string
  price: number
  createdAt: string
}

export default async function PurchaseHistoryPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Placeholder data - in a real implementation, this would fetch actual purchase history
  const purchases: Purchase[] = [
    // Empty for now - will be populated when Phase 4 (payments) is implemented
  ]

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
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">0 purchases</p>
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
              {/* This section will be populated when Phase 4 is implemented */}
              {purchases.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      📚
                    </div>
                    <div>
                      <h4 className="font-medium">{purchase.title}</h4>
                      <p className="text-sm text-muted-foreground">by {purchase.author}</p>
                      <p className="text-xs text-muted-foreground">
                        Purchased on {new Date(purchase.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">Completed</Badge>
                    <span className="font-medium">${purchase.price}</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Receipt className="h-4 w-4" />
                      </Button>
                    </div>
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