import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { IconTile } from "@/components/ui/IconTile";
import { ProductCard } from "@/components/cards/ProductCard";
import { formatDate, formatNumber } from "@/lib/utils";
import { getProducts } from "@/lib/woocommerce";

export const metadata: Metadata = {
  title: "New Arrivals",
  description:
    "Explore new arrivals in industrial products and clearance stock.",
};

export default async function RecentlyAddedPage() {
  const products = await getProducts();
  const recentProducts = [...products]
    .sort((a, b) => new Date(b.added_date).getTime() - new Date(a.added_date).getTime())
    .slice(0, 12);

  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "New Arrivals" }]}
        eyebrow="New arrivals"
        title="New arrivals"
        description="Explore the latest industrial products added to our catalogue."
        stats={recentProducts.length ? [[formatNumber(recentProducts.length), "New listings"]] : undefined}
      />

      <section className="section">
        <div className="shell">
          <SectionHeading
            eyebrow="Latest stock"
            title="Latest products"
            description="Condition, quantity and CTA on every listing."
            action={{ label: "All clearance", href: "/clearance" }}
          />

          {recentProducts.length ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {recentProducts.map((product) => (
                <div key={product.id} className="flex h-full flex-col">
                  {product.added_date ? <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-steel-500">
                    Listed {formatDate(product.added_date)}
                  </p> : null}
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="card mx-auto mt-8 flex max-w-xl flex-col items-center p-10 text-center">
              <IconTile>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="8.5" />
                </svg>
              </IconTile>
              <p className="mt-4 text-base font-bold text-navy-900">No recent listings to show</p>
              <p className="mt-2 max-w-md text-sm text-steel-600">
                Check back soon, or browse the full clearance catalogue in the meantime.
              </p>
              <Link href="/clearance" className="btn-navy btn-sm mt-5 inline-flex">
                Browse clearance stock
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
