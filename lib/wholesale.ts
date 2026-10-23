import type { Product } from "@/lib/types";

/** Bulk quantity threshold used to route a listing to the wholesale view. */
export const WHOLESALE_QUANTITY_THRESHOLD = 200;

export function isWholesaleProduct(product: Product): boolean {
  return (
    product.listing_type === "Whole Lot" ||
    product.category === "lots-bulk-clearance" ||
    (product.quantity_available ?? 0) >= WHOLESALE_QUANTITY_THRESHOLD
  );
}

export function splitByChannel(products: Product[]): { retail: Product[]; wholesale: Product[] } {
  const retail: Product[] = [];
  const wholesale: Product[] = [];
  for (const product of products) {
    (isWholesaleProduct(product) ? wholesale : retail).push(product);
  }
  return { retail, wholesale };
}
