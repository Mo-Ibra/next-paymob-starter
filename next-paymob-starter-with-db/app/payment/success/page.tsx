"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const { clearCart } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [isPopup, setIsPopup] = useState(false);

  const orderId = searchParams.get("order_id");
  const transactionId = searchParams.get("transaction_id");
  const success = searchParams.get("success");

  useEffect(() => {
    const checkIfPopup = () => {
      try {
        return window.opener && window.opener !== window;
      } catch (error) {
        return false;
      }
    };

    setIsPopup(checkIfPopup());

    // Clear cart on successful payment
    clearCart();

    const updateOrderStatus = async () => {
      if (success === "true" && orderId) {
        try {
          // Find order by Paymob order ID and update status
          const response = await fetch(`/api/orders?paymobOrderId=${orderId}`);
          const result = await response.json();

          if (result.orders && result.orders.length > 0) {
            const order = result.orders[0];
            setOrderNumber(order.order_number);

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
            });

            if (checkIfPopup()) {
              window.opener?.postMessage(
                {
                  type: "PAYMENT_SUCCESS",
                  orderId: orderId,
                  transactionId: transactionId,
                  orderNumber: order.order_number,
                },
                window.location.origin
              );

              // Close popup after a short delay
              setTimeout(() => {
                window.close();
              }, 2000);
            }
          }
        } catch (error) {
          console.error("Failed to update order status:", error);

          if (checkIfPopup()) {
            window.opener?.postMessage(
              {
                type: "PAYMENT_FAILED",
                error: "Failed to update order status",
              },
              window.location.origin
            );
          }
        }
      }
    };

    updateOrderStatus();
  }, [clearCart, success, orderId, transactionId]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">
              Payment Successful!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              Thank you for your purchase. Your order has been confirmed and
              will be processed shortly.
              {isPopup && " This window will close automatically."}
            </p>

            {(orderId || orderNumber) && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium">Order Details:</p>
                {orderNumber && (
                  <p className="text-sm text-muted-foreground">
                    Order Number: {orderNumber}
                  </p>
                )}
                {orderId && (
                  <p className="text-sm text-muted-foreground">
                    Paymob Order ID: {orderId}
                  </p>
                )}
                {transactionId && (
                  <p className="text-sm text-muted-foreground">
                    Transaction ID: {transactionId}
                  </p>
                )}
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
  );
}
