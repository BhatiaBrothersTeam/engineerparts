import Link from "next/link";
import { ProductCard } from "@/components/cards/ProductCard";
import { AccountSectionHeader } from "@/components/account/AccountSectionHeader";
import { IconTile } from "@/components/ui/IconTile";
import { getAccountResource } from "@/lib/auth-server";
import { getProducts } from "@/lib/woocommerce";

export default async function SavedProductsPage() {
  const [data, products] = await Promise.all([
    getAccountResource<{ ok: true; productIds: number[] }>("saved-products"),
    getProducts(),
  ]);
  const ids = new Set(data?.productIds.map(String) ?? []);
  const saved = products.filter((product) => ids.has(product.id));

  return (
    <div>
      <AccountSectionHeader eyebrow="Your shortlist" title="Saved products" description="Products saved to your customer account." />
      {saved.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {saved.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="card border-dashed p-8 text-center sm:p-10">
          <div className="mx-auto">
            <IconTile>
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M12 20s-7.5-4.6-9.7-9A5.1 5.1 0 0 1 12 6.3 5.1 5.1 0 0 1 21.7 11c-2.2 4.4-9.7 9-9.7 9Z" strokeLinejoin="round" />
              </svg>
            </IconTile>
          </div>
          <h3 className="text-h4 mt-4 text-navy-950">No saved products yet.</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-steel-600">
            Save products while browsing to compare and order them later.
          </p>
          <Link href="/clearance" className="btn-primary mt-5 inline-flex">
            Explore Products
          </Link>
        </div>
      )}
    </div>
  );
}
