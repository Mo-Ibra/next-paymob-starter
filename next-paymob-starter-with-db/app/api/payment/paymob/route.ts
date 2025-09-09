import { type NextRequest, NextResponse } from "next/server"

// Paymob API configuration
const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY || "your-paymob-api-key"
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID || "your-integration-id"
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID || "your-iframe-id"

export async function POST(request: NextRequest) {
  try {
    const { items, total, customerName, customerEmail, customerPhone, shippingAddress, paymentMethod } =
      await request.json()

    const orderResponse = await fetch(`${request.nextUrl.origin}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        items,
        totalAmount: total,
      }),
    })

    const orderResult = await orderResponse.json()
    if (!orderResult.order) {
      throw new Error("Failed to create order in database")
    }

    const dbOrder = orderResult.order

    // Step 1: Get authentication token
    const authResponse = await fetch("https://accept.paymob.com/api/auth/tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: PAYMOB_API_KEY,
      }),
    })

    const authData = await authResponse.json()
    const authToken = authData.token

    // Step 2: Create order
    const paymobOrderResponse = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_token: authToken,
        delivery_needed: "true",
        amount_cents: Math.round(total * 100), // Convert to cents
        currency: "EGP",
        merchant_order_id: dbOrder.order_number,
        items: items.map((item: any) => ({
          name: item.name,
          amount_cents: Math.round(item.price * 100),
          description: item.description || "",
          quantity: item.quantity,
        })),
      }),
    })

    const paymobOrderData = await paymobOrderResponse.json()
    const paymobOrderId = paymobOrderData.id

    console.log("Paymob order data", paymobOrderData);

    console.log("Paymob Order Id", paymobOrderId);

    await fetch(`${request.nextUrl.origin}/api/orders/${dbOrder.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymob_order_id: paymobOrderId.toString(),
      }),
    });

    // Step 3: Get payment key
    const paymentKeyResponse = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_token: authToken,
        amount_cents: Math.round(total * 100),
        expiration: 3600,
        order_id: paymobOrderId,
        billing_data: {
          apartment: "NA",
          email: customerEmail,
          floor: "NA",
          first_name: customerName.split(" ")[0] || "Customer",
          street: shippingAddress.address,
          building: "NA",
          phone_number: shippingAddress.phone,
          shipping_method: "PKG",
          postal_code: shippingAddress.postalCode,
          city: shippingAddress.city,
          country: "EG",
          last_name: customerName.split(" ").slice(1).join(" ") || "Name",
          state: shippingAddress.city,
        },
        currency: "EGP",
        integration_id: PAYMOB_INTEGRATION_ID,
      }),
    })

    const paymentKeyData = await paymentKeyResponse.json()
    const paymentToken = paymentKeyData.token

    // Step 4: Generate payment URL
    const paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`

    return NextResponse.json({
      success: true,
      paymentUrl,
      orderId: paymobOrderId,
      paymentToken,
      dbOrderId: dbOrder.id,
      orderNumber: dbOrder.order_number,
    })
  } catch (error) {
    console.error("Paymob payment error:", error)
    return NextResponse.json({ success: false, error: "Payment processing failed" }, { status: 500 })
  }
}