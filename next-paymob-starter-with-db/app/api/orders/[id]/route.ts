import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.payment_status !== undefined) updateData.payment_status = body.payment_status
    if (body.order_status !== undefined) updateData.order_status = body.order_status
    if (body.paymob_transaction_id !== undefined) updateData.paymob_transaction_id = body.paymob_transaction_id
    if (body.paymob_order_id !== undefined) updateData.paymob_order_id = body.paymob_order_id

    // Check if order exists first
    const { data: existingOrder, error: fetchError } = await supabase.from("orders").select("id").eq("id", id).single()

    if (fetchError || !existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Update the order
    const { data: updatedOrders, error } = await supabase.from("orders").update(updateData).eq("id", id).select()

    if (error) {
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
    }

    if (!updatedOrders || updatedOrders.length === 0) {
      return NextResponse.json({ error: "Order not found or no changes made" }, { status: 404 })
    }

    const order = updatedOrders[0]
    return NextResponse.json({ order }, { status: 200 })
  } catch (error) {
    console.error("Order update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
