import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { IconTile } from "@/components/ui/IconTile";
import { BrandCard } from "@/components/cards/BrandCard";
import { TrackView } from "@/components/TrackView";
import { brandsFromProducts, productsForBrand } from "@/lib/data/brands";
import { formatNumber } from "@/lib/utils";
import { getProducts } from "@/lib/woocommerce";

export const metadata: Metadata = {
  title: "Brands",
  description: "Browse industrial products by brand.",
};

export default async function BrandsPage() {
  const products = await getProducts();
  const brands = brandsFromProducts(products);

  return (
    <>
      <TrackView event="brand_view" payload={{ view: "index", count: brands.length }} />
      <PageHero
        breadcrumbs={[{ label: "Brands" }]}
        eyebrow="Brands"
        title="Products by brand"
        description="Browse products from the manufacturers represented in our catalogue."
        stats={[
          ...(brands.length ? [[String(brands.length), "Brands"] as [string, string]] : []),
          ...(products.length ? [[formatNumber(products.length), "Listings"] as [string, string]] : []),
        ]}
      />

      <section className="section">
        <div className="shell">
          {brands.length ? (
            <div className="brand-grid">
              {brands.map((brand) => (
                <BrandCard
                  key={brand.slug}
                  brand={brand}
                  count={productsForBrand(products, brand.slug).length}
                />
              ))}
            </div>
          ) : (
            <div className="card mx-auto flex max-w-xl flex-col items-center p-10 text-center">
              <IconTile>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M3 7h18M3 12h18M3 17h18" strokeLinecap="round" />
                </svg>
              </IconTile>
              <p className="mt-4 text-base font-bold text-navy-900">No brands listed right now</p>
              <p className="mt-2 max-w-md text-sm text-steel-600">
                Stock rotates frequently. Browse the full clearance catalogue or send an enquiry and
                we will check warehouse holdings not yet listed.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Link href="/clearance" className="btn-navy btn-sm">
                  Browse clearance stock
                </Link>
                <Link href="/contact" className="btn-outline btn-sm">
                  Send an enquiry
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
