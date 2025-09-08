"use client";

import { Header } from "@/components/Header";
import { ProductGrid } from "@/components/product-grid";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // Get variables from .env
    const variable = process.env.NEXT_PUBLIC_PAYMOB_API_KEY;
    console.log(variable);
  }, []);

  return (
    <div>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Welcome to Our Store
            </h1>
            <p className="text-muted-foreground text-lg">
              Discover amazing products at great prices
            </p>
          </div>
          <ProductGrid />
        </main>
      </div>
    </div>
  );
}
