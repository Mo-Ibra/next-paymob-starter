import { NextRequest, NextResponse } from "next/server";

// Paymob API configuration
const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID;

export async function POST(request: NextRequest) {

  console.log(PAYMOB_API_KEY);

  try {
    const { items, total, user, shippingAddress, paymentMethod } =
      await request.json();

    // Step 1: Get authentication token
    const authResponse = await fetch(
      "https://accept.paymob.com/api/auth/tokens",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: PAYMOB_API_KEY,
        }),
      }
    );

    const authData = await authResponse.json();
    const authToken = authData.token;

    console.log("Auth token:", authToken);

    // Step 2: Create order
    const orderResponse = await fetch(
      "https://accept.paymob.com/api/ecommerce/orders",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth_token: authToken,
          delivery_needed: "false",
          amount_cents: Math.round(total * 100), // Convert to cents,
          currency: "EGP",
          items: items.map((item: any) => ({
            name: item.name,
            amount_cents: Math.round(item.price * 100),
            description: item.description || "",
            quantity: item.quantity,
          })),
        }),
      }
    );

    const orderData = await orderResponse.json();
    
    console.log("Order data:", orderData);

    const orderId = orderData.id;

    console.log("Order ID:", orderId);

    // Step 3: Get payment key
    const paymentResponse = await fetch(
      "https://accept.paymob.com/api/acceptance/payment_keys",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth_token: authToken,
          amount_cents: Math.round(total * 100),
          expiration: 3600,
          order_id: orderId,
          billing_data: {
            apartment: "NA",
            email: user?.email || "customer@email.com",
            floor: "NA",
            first_name: shippingAddress.fullName.split(" ")[0] || "Customer",
            street: shippingAddress.address,
            building: "NA",
            phone_number: shippingAddress.phone,
            shipping_method: "PKG",
            postal_code: shippingAddress.postalCode,
            city: shippingAddress.city,
            country: "EG",
            last_name:
              shippingAddress.fullName.split(" ").slice(1).join(" ") || "Name",
            state: shippingAddress.city,
          },
          currency: "EGP",
          integration_id: PAYMOB_INTEGRATION_ID,
        }),
      }
    );

    const paymentKeyData = await paymentResponse.json();
    console.log("Payment key data", paymentKeyData);

    const paymentToken = paymentKeyData.token;

    console.log("Payment token:", paymentToken);


    // Step 4: Generate payment URL
    const paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;

    return NextResponse.json({
      success: true,
      paymentUrl,
      orderId,
      paymentToken,
    });

  } catch (error) {
    console.error("Paymob payment error:", error);
    return NextResponse.json(
      { success: false, error: "Payment processing failed" },
      { status: 500 }
    );
  }
}
