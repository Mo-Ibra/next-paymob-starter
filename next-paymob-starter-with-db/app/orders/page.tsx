"use client";

import type React from "react";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Package, ArrowLeft, Search } from "lucide-react";
import Link from "next/link";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  items: OrderItem[];
  total_amount: number;
  payment_status: string;
  order_status: string;
  created_at: string;
  shipping_address: {
    fullName: string;
    address: string;
    city: string;
    postalCode: string;
    phone: string;
  };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchOrderNumber, setSearchOrderNumber] = useState("");

  const fetchOrders = async (email?: string, orderNumber?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (email) params.append("email", email);
      if (orderNumber) params.append("orderNumber", orderNumber);

      const response = await fetch(`/api/orders?${params.toString()}`);
      const result = await response.json();

      if (result.orders) {
        setOrders(result.orders);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(searchEmail, searchOrderNumber);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shop
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Order Lookup</h1>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Find Your Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="orderNumber">Order Number (Optional)</Label>
                  <Input
                    id="orderNumber"
                    placeholder="Enter order number"
                    value={searchOrderNumber}
                    onChange={(e) => setSearchOrderNumber(e.target.value)}
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={!searchEmail && !searchOrderNumber}
              >
                Search Orders
              </Button>
            </form>
          </CardContent>
        </Card>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No orders found</h2>
              <p className="text-muted-foreground mb-4">
                {searchEmail || searchOrderNumber
                  ? "No orders found matching your search criteria."
                  : "Enter your email address to find your orders."}
              </p>
              <Link href="/">
                <Button>Start Shopping</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        Order {order.order_number}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Placed on{" "}
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(order.order_status)}>
                        {order.order_status.charAt(0).toUpperCase() +
                          order.order_status.slice(1)}
                      </Badge>
                      <p className="text-lg font-bold mt-1">
                        ${order.total_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Items:</h4>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center"
                          >
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Qty: {item.quantity} × ${item.price.toFixed(2)}
                              </p>
                            </div>
                            <p className="font-medium">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Shipping Address:</h4>
                      <p className="text-sm text-muted-foreground">
                        {order.shipping_address.fullName}
                        <br />
                        {order.shipping_address.address}
                        <br />
                        {order.shipping_address.city},{" "}
                        {order.shipping_address.postalCode}
                      </p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <Badge
                        variant="outline"
                        className={getStatusColor(order.payment_status)}
                      >
                        Payment:{" "}
                        {order.payment_status.charAt(0).toUpperCase() +
                          order.payment_status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
