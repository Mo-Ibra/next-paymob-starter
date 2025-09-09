import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { orderId, transactionId } = await request.json()

    if (!orderId && !transactionId) {
      return NextResponse.json({ error: "Order ID or Transaction ID is required" }, { status: 400 })
    }

    // Step 1: Get authentication token from Paymob
    const authResponse = await fetch("https://accept.paymob.com/api/auth/tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: process.env.PAYMOB_API_KEY,
      }),
    })

    if (!authResponse.ok) {
      throw new Error("Failed to authenticate with Paymob")
    }

    const authData = await authResponse.json()
    const authToken = authData.token

    // Step 2: Query transaction status using Order ID or Transaction ID
    let verifyUrl = "https://accept.paymob.com/api/acceptance/transactions"

    if (orderId) {
      verifyUrl += `?order=${orderId}`
    } else if (transactionId) {
      verifyUrl += `/${transactionId}`
    }

    const verifyResponse = await fetch(verifyUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!verifyResponse.ok) {
      throw new Error("Failed to verify payment with Paymob")
    }

    const verifyData = await verifyResponse.json()

    // Handle different response formats
    let transaction
    if (verifyData.results && Array.isArray(verifyData.results)) {
      // Handle paginated response (when querying by order ID)
      transaction = verifyData.results.find((t: { order: { id: any } }) => t.order?.id == orderId) || verifyData.results[0]
    } else if (Array.isArray(verifyData)) {
      // Handle array response
      transaction = verifyData.find((t) => t.order?.id == orderId) || verifyData[0]
    } else {
      // Handle single transaction response
      transaction = verifyData
    }

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    const isPaid = transaction.success === true && transaction.order?.payment_status === "PAID"

    return NextResponse.json({
      success: true,
      isPaid,
      transactionId: transaction.id,
      orderId: transaction.order?.id,
      amount: transaction.amount_cents / 100, // Convert from cents
      status: transaction.order?.payment_status || "unknown",
      paymentMethod: transaction.source_data?.type || "unknown",
      transaction: transaction,
    });
  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json({ error: "Failed to verify payment status" }, { status: 500 })
  }
}
