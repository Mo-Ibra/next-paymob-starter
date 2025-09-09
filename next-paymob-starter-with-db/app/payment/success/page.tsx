"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useCart } from "@/components/cart-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Package, ArrowRight, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function PaymentSuccessPage() {
  const { clearCart } = useCart()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [isPopup, setIsPopup] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [paymentVerified, setPaymentVerified] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)

  const orderId = searchParams.get("order_id")
  const transactionId = searchParams.get("transaction_id")
  const success = searchParams.get("success")

  useEffect(() => {
    const checkIfPopup = () => {
      try {
        return window.opener && window.opener !== window
      } catch (error) {
        return false
      }
    }

    setIsPopup(checkIfPopup())

    const verifyAndProcessPayment = async () => {
      if (!orderId && !transactionId) {
        setVerificationError("Missing payment information")
        setIsVerifying(false)
        return
      }

      try {
        // Verify payment status with Paymob
        const verifyResponse = await fetch("/api/payment/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: orderId,
            transactionId: transactionId,
          }),
        })

        const verifyResult = await verifyResponse.json()

        if (!verifyResponse.ok) {
          throw new Error(verifyResult.error || "Payment verification failed")
        }

        if (!verifyResult.isPaid) {
          setVerificationError("Payment not completed. Please complete your payment to access this page.")
          setIsVerifying(false)
          return
        }

        // Payment is verified, proceed with order processing
        setPaymentVerified(true)
        clearCart()

        // Find order by Paymob order ID and update status
        const response = await fetch(`/api/orders?paymobOrderId=${orderId}`)
        const result = await response.json()

        if (result.orders && result.orders.length > 0) {
          const order = result.orders[0]
          setOrderNumber(order.order_number)

          // Update payment and order status
          await fetch(`/api/orders/${order.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              payment_status: "completed",
              order_status: "processing",
              paymob_transaction_id: transactionId || null,
            }),
          })

          if (checkIfPopup()) {
            window.opener?.postMessage(
              {
                type: "PAYMENT_SUCCESS",
                orderId: orderId,
                transactionId: transactionId,
                orderNumber: order.order_number,
              },
              window.location.origin,
            )

            setTimeout(() => {
              window.close()
            }, 2000)
          }
        }
      } catch (error) {
        console.error("Payment verification failed:", error)
        setVerificationError(error instanceof Error ? error.message : "Payment verification failed")

        if (checkIfPopup()) {
          window.opener?.postMessage(
            {
              type: "PAYMENT_FAILED",
              error: "Payment verification failed",
            },
            window.location.origin,
          )
        }
      } finally {
        setIsVerifying(false)
      }
    }

    verifyAndProcessPayment()
  }, [clearCart, orderId, transactionId])

  if (isVerifying) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardContent className="py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Verifying your payment...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (verificationError || !paymentVerified) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader className="pb-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-600">Payment Required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                {verificationError || "You need to complete your payment to access this page."}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/">
                  <Button variant="outline">Return to Shop</Button>
                </Link>
                <Link href="/checkout">
                  <Button>Complete Payment</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              Thank you for your purchase. Your order has been confirmed and will be processed shortly.
              {isPopup && " This window will close automatically."}
            </p>

            {(orderId || orderNumber) && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium">Order Details:</p>
                {orderNumber && <p className="text-sm text-muted-foreground">Order Number: {orderNumber}</p>}
                {orderId && <p className="text-sm text-muted-foreground">Paymob Order ID: {orderId}</p>}
                {transactionId && <p className="text-sm text-muted-foreground">Transaction ID: {transactionId}</p>}
              </div>
            )}

            {!isPopup && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/">
                  <Button variant="outline">Continue Shopping</Button>
                </Link>
                <Link href="/orders">
                  <Button className="gap-2">
                    <Package className="h-4 w-4" />
                    View Orders
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
