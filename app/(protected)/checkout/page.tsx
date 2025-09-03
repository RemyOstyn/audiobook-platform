'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCartStore } from '@/lib/stores/cart-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, CreditCard, Loader2, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

const checkoutSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  paymentMethod: z.enum(['credit_card', 'paypal'], {
    message: 'Please select a payment method',
  }),
})

type CheckoutForm = z.infer<typeof checkoutSchema>

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotalPrice, getTotalItems, clearCart } = useCartStore()
  const [isProcessing, setIsProcessing] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const totalPrice = getTotalPrice()
  const totalItems = getTotalItems()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: 'credit_card',
    },
  })

  useEffect(() => {
    // Get user email if logged in
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setUserEmail(user.email)
        setValue('email', user.email)
      }
    }
    getUser()
  }, [setValue])

  // Redirect to cart if no items
  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart')
    }
  }, [items.length, router])

  const onSubmit = async (data: CheckoutForm) => {
    setIsProcessing(true)
    
    try {
      // Validate cart items
      const validateResponse = await fetch('/api/checkout/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.map(item => ({ 
          audiobook_id: item.audiobook.id, 
          price: item.audiobook.price 
        })) }),
      })

      if (!validateResponse.ok) {
        const error = await validateResponse.json()
        throw new Error(error.message || 'Failed to validate cart')
      }

      // Process the order
      const orderResponse = await fetch('/api/checkout/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          paymentMethod: data.paymentMethod,
          items: items.map(item => ({
            audiobook_id: item.audiobook.id,
            price: item.audiobook.price,
          })),
          totalAmount: totalPrice,
        }),
      })

      if (!orderResponse.ok) {
        const error = await orderResponse.json()
        throw new Error(error.message || 'Failed to process order')
      }

      const { order } = await orderResponse.json()
      
      // Clear cart after successful order
      await clearCart()
      
      // Redirect to success page
      router.push(`/checkout/success?order=${order.order_number}`)
      
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to process order')
    } finally {
      setIsProcessing(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <ShoppingBag className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
          <Button asChild>
            <Link href="/browse">Browse Audiobooks</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" asChild>
              <Link href="/cart">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Cart
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
              <p className="text-gray-500">
                Complete your purchase of {totalItems} {totalItems === 1 ? 'audiobook' : 'audiobooks'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Checkout Form */}
              <div className="space-y-6">
                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        disabled={!!userEmail}
                        className="mt-1"
                      />
                      {errors.email && (
                        <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          {...register('firstName')}
                          className="mt-1"
                        />
                        {errors.firstName && (
                          <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          {...register('lastName')}
                          className="mt-1"
                        />
                        {errors.lastName && (
                          <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      defaultValue="credit_card"
                      onValueChange={(value) => setValue('paymentMethod', value as 'credit_card' | 'paypal')}
                    >
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="credit_card" id="credit_card" />
                        <Label htmlFor="credit_card" className="flex items-center gap-2 cursor-pointer">
                          <CreditCard className="h-4 w-4" />
                          Credit Card (Demo)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="paypal" id="paypal" />
                        <Label htmlFor="paypal" className="cursor-pointer">
                          PayPal (Demo)
                        </Label>
                      </div>
                    </RadioGroup>
                    {errors.paymentMethod && (
                      <p className="text-sm text-red-600 mt-2">{errors.paymentMethod.message}</p>
                    )}
                    
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Demo Mode:</strong> This is a simulated checkout. No real payment will be processed.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div>
                <Card className="sticky top-6">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Items List */}
                    <div className="space-y-3 mb-4">
                      {items.map((item) => (
                        <div key={item.id} className="flex gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded overflow-hidden flex-shrink-0">
                            {item.audiobook.coverUrl ? (
                              <Image
                                src={item.audiobook.coverUrl}
                                alt={item.audiobook.title}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingBag className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {item.audiobook.title}
                            </h4>
                            <p className="text-xs text-gray-500">by {item.audiobook.author}</p>
                            <div className="flex items-center justify-between mt-1">
                              <Badge variant="secondary" className="text-xs">
                                Qty: {item.quantity}
                              </Badge>
                              <span className="text-sm font-medium text-gray-900">
                                ${(item.audiobook.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />

                    {/* Totals */}
                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})
                        </span>
                        <span className="text-gray-900">${totalPrice.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax</span>
                        <span className="text-gray-900">$0.00</span>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold text-gray-900">Total</span>
                        <span className="text-lg font-bold text-gray-900">
                          ${totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Place Order Button */}
                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={isProcessing || items.length === 0}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing Order...
                        </>
                      ) : (
                        `Place Order - $${totalPrice.toFixed(2)}`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}