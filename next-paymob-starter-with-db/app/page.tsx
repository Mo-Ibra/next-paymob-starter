import { Header } from "@/components/Header";
import { ProductGrid } from "@/components/product-grid";

export default async function Home() {
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
