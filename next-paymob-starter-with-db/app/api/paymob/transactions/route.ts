export async function GET() {
  try {
    // First, get authentication token
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
    const token = authData.token

    // Get all transactions
    const transactionsResponse = await fetch("https://accept.paymob.com/api/acceptance/transactions", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!transactionsResponse.ok) {
      throw new Error("Failed to fetch transactions from Paymob")
    }

    const transactionsData = await transactionsResponse.json()

    return Response.json({
      success: true,
      data: transactionsData,
      count: transactionsData.length || 0,
    })
  } catch (error) {
    console.error("Error fetching Paymob transactions:", error)
    return Response.json(
      {
        success: false,
        error: "Failed to fetch transactions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
