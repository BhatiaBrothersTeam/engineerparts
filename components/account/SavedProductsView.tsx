"use client";

import Link from "next/link";
import { ProductGrid } from "@/components/cards/ProductGrid";
import { useSavedProducts } from "@/components/providers/SavedProductsProvider";
import type { Product } from "@/lib/types";

export function SavedProductsView({ products }: { products: Product[] }) {
  const { ready, isSaved } = useSavedProducts();
  const saved = products.filter((product) => isSaved(product.id));
  if (!ready) return (
    <div role="status" aria-busy="true">
      <p className="text-sm text-steel-600">Loading saved products…</p>
      <div aria-hidden="true" className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
        {[0, 1].map((item) => <div key={item} className="card overflow-hidden"><div className="aspect-[4/3] bg-navy-50" /><div className="space-y-3 p-4"><div className="h-4 w-3/4 rounded bg-navy-100" /><div className="h-4 w-1/2 rounded bg-navy-50" /></div></div>)}
      </div>
    </div>
  );
  if (!saved.length) return (
    <div className="card border-dashed p-8 text-center">
      <p className="font-bold text-navy-950">No saved products yet.</p>
      <Link href="/clearance" className="btn-primary mt-5 inline-flex">Explore Products</Link>
    </div>
  );
  return <ProductGrid products={saved} />;
}
