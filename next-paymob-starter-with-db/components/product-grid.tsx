"use client"

import { ProductCard } from "@/components/product-cart";

// Mock product data
const products = [
  {
    id: "1",
    name: "Wireless Headphones",
    price: 99.99,
    image: "/images/1.png",
    description: "High-quality wireless headphones with noise cancellation",
  },
  {
    id: "2",
    name: "Smart Watch",
    price: 199.99,
    image: "/images/1.png",
    description: "Feature-rich smartwatch with health tracking",
  },
  {
    id: "3",
    name: "Laptop Stand",
    price: 49.99,
    image: "/images/1.png",
    description: "Ergonomic laptop stand for better posture",
  },
  {
    id: "4",
    name: "Bluetooth Speaker",
    price: 79.99,
    image: "/images/1.png",
    description: "Portable speaker with excellent sound quality",
  },
  {
    id: "5",
    name: "Phone Case",
    price: 24.99,
    image: "/images/1.png",
    description: "Protective case with premium materials",
  },
  {
    id: "6",
    name: "USB Cable",
    price: 14.99,
    image: "/images/1.png",
    description: "Fast charging USB-C cable",
  },
]

export function ProductGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
