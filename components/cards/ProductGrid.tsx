"use client";

import { ProductCard } from "@/components/cards/ProductCard";
import { PRODUCT_PAGE_SIZE, ProductPagination, useProductPage } from "@/components/ui/ProductPagination";
import type { Product } from "@/lib/types";

export function ProductGrid({ products, className = "product-grid" }: { products: Product[]; className?: string }) {
  const { page, pageCount, start } = useProductPage(products.length);
  return (
    <>
      <div id="product-grid" className={`scroll-mt-48 ${className}`}>
        {products.slice(start, start + PRODUCT_PAGE_SIZE).map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
      <ProductPagination total={products.length} page={page} pageCount={pageCount} gridId="product-grid" />
    </>
  );
}
