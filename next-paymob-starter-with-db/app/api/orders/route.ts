import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Handles POST requests to the orders endpoint.
 * @param request The Next.js request object.
 * @returns A JSON response containing the created order object.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      items,
      totalAmount,
      paymobOrderId,
      paymobTransactionId,
    } = body;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        /**
         * The unique order number generated
         * by the server.
         */
        order_number: orderNumber,
        /**
         * The customer's name.
         */
        customer_name: customerName,
        /**
         * The customer's email address.
         */
        customer_email: customerEmail,
        /**
         * The customer's phone number.
         */
        customer_phone: customerPhone,
        /**
         * The shipping address.
         */
        shipping_address: shippingAddress,
        /**
         * The items in the order.
         */
        items: items,
        /**
         * The total amount of the order.
         */
        total_amount: totalAmount,
        /**
         * The Paymob order ID.
         */
        paymob_order_id: paymobOrderId,
        /**
         * The Paymob transaction ID.
         */
        paymob_transaction_id: paymobTransactionId,
        /**
         * The payment status. Defaults to "pending".
         */
        payment_status: "pending",
        /**
         * The order status. Defaults to "processing".
         */
        order_status: "processing",
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Handles GET requests to the orders endpoint.
 * @param request The Next.js request object.
 * @returns A JSON response containing an array of orders.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const orderNumber = searchParams.get("orderNumber");
    const paymobOrderId = searchParams.get("paymobOrderId");

    let query = supabase.from("orders").select("*");

    // Apply filters to the query
    if (email) {
      query = query.eq("customer_email", email);
    }
    if (orderNumber) {
      query = query.eq("order_number", orderNumber);
    }
    if (paymobOrderId) {
      query = query.eq("paymob_order_id", paymobOrderId);
    }

    // Sort the query by the created_at column in descending order
    query = query.order("created_at", { ascending: false });

    // Execute the query and return the result
    const { data: orders, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 }
      );
    }

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
