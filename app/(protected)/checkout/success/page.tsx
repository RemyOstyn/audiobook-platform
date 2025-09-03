'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, Download, Library, ShoppingBag, ArrowRight } from 'lucide-react'

interface OrderDetails {
  order_number: string
  email: string
  total_amount: string
  status: string
  completed_at: string
  order_items: Array<{
    id: string
    price: string
    audiobook: {
      id: string
      title: string
      author: string
      cover_image_url: string | null
    }
  }>
}

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderNumber) {
      router.push('/browse')
      return
    }

    // Fetch order details
    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`/api/orders/${orderNumber}`)
        
        if (!response.ok) {
          throw new Error('Order not found')
        }

        const data = await response.json()
        setOrderDetails(data.order)
      } catch (err) {
        console.error('Failed to fetch order details:', err)
        setError('Failed to load order details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrderDetails()
  }, [orderNumber, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !orderDetails) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <ShoppingBag className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The order details could not be loaded.'}</p>
          <Button asChild>
            <Link href="/browse">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-6">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-gray-600">
              Thank you for your purchase. Your audiobooks are now available in your library.
            </p>
          </div>

          {/* Order Details Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Order Details</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {orderDetails.status === 'completed' ? 'Completed' : orderDetails.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">Order Number</p>
                  <p className="text-lg font-mono text-gray-900">{orderDetails.order_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-gray-900">{orderDetails.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total</p>
                  <p className="text-lg font-bold text-gray-900">
                    ${parseFloat(orderDetails.total_amount).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="text-gray-900">
                    {new Date(orderDetails.completed_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Purchased Items */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Audiobooks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderDetails.order_items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded overflow-hidden flex-shrink-0">
                      {item.audiobook.cover_image_url ? (
                        <Image
                          src={item.audiobook.cover_image_url}
                          alt={item.audiobook.title}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-blue-600" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{item.audiobook.title}</h4>
                      <p className="text-sm text-gray-600">by {item.audiobook.author}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        ${parseFloat(item.price).toFixed(2)}
                      </p>
                      <Badge variant="secondary" className="mt-1">
                        <Download className="h-3 w-3 mr-1" />
                        Available
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/dashboard/library" className="flex items-center gap-2">
                <Library className="h-4 w-4" />
                Access My Library
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            
            <Button variant="outline" size="lg" asChild>
              <Link href="/browse">
                Continue Shopping
              </Link>
            </Button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">What&apos;s Next?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your audiobooks are now available in your library</li>
              <li>• You can download them anytime for offline listening</li>
              <li>• A confirmation email has been sent to {orderDetails.email}</li>
              <li>• Need help? Contact our support team</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}