import Image from "next/image";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatRow } from "@/components/ui/StatRow";
import { BrandCard } from "@/components/cards/BrandCard";
import { ClearanceStockTabs } from "@/components/home/ClearanceStockTabs";
import { BulkDealSection } from "@/components/home/BulkDealSection";
import { brandsFromProducts } from "@/lib/data/brands";
import { img, photo } from "@/lib/images";
import { formatNumber } from "@/lib/utils";
import { isWholesaleProduct } from "@/lib/wholesale";
import type { Product } from "@/lib/types";
import { getProducts } from "@/lib/woocommerce";

function countByBrand(products: Awaited<ReturnType<typeof getProducts>>, name: string) {
  return products.filter((p) => p.brand === name).length;
}

export default async function HomePage() {
  const products = await getProducts();
  const available = products.filter((product) => product.status !== "Sold");
  const productsByTab: Record<"latest" | "lowest" | "bulk" | "equipment", Product[]> = {
    latest: [...available].sort((a, b) => new Date(b.added_date).getTime() - new Date(a.added_date).getTime()).slice(0, 8),
    lowest: [...available].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity)).slice(0, 8),
    bulk: available
      .filter(isWholesaleProduct)
      .sort((a, b) => (b.quantity_available ?? -1) - (a.quantity_available ?? -1))
      .slice(0, 8),
    equipment: available
      .filter((product) => product.category === "equipment" || product.badges.includes("EQUIPMENT"))
      .slice(0, 8),
  };
  const brands = brandsFromProducts(products);
  const categoryCount = new Set(products.map((product) => product.category).filter((category) => category && category !== "uncategorised")).size;
  const inventoryStats = [
    ...(products.length ? [[formatNumber(products.length), "Listings"]] : []),
    ...(brands.length ? [[formatNumber(brands.length), "Brands"]] : []),
    ...(categoryCount ? [[formatNumber(categoryCount), "Categories"]] : []),
  ] as [string, string][];

  return (
    <>
      <section className="border-b border-navy-100 bg-white">
        <div className="shell grid grid-cols-[minmax(0,1fr)] items-stretch gap-7 py-7 sm:gap-8 sm:py-10 lg:grid-cols-2 lg:gap-12 lg:py-12">
          <div className="min-w-0 flex flex-col justify-center">
            <p className="eyebrow text-brand-600">Engineer Parts &nbsp;|&nbsp; Industrial supplier</p>
            <h1 className="text-display mt-4 text-navy-900">
              Industrial parts.
              <br />
              Equipment and tools.
              <br />
              <span className="text-brand-600">Ready to source.</span>
            </h1>
            <p className="text-lead mt-4 max-w-2xl text-steel-600 sm:mt-5">
              Find industrial equipment, spare parts and tools. Buy available clearance stock online or send our team an enquiry.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:mt-7 sm:flex sm:flex-wrap">
              <Link href="/clearance" className="btn-primary">
                Browse Clearance Stock
              </Link>
              <Link href="/enquiry" className="btn-outline">
                Submit an Enquiry
              </Link>
            </div>

            <div className="mt-7 sm:mt-8">
              <div className="hidden lg:block">
                <SearchBar
                variant="hero"
                  placeholder="Search by brand, part number, model or product..."
                />
              </div>
              {brands.length ? (
                <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0 lg:mt-3">
                  <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-steel-500">
                    Popular
                  </span>
                  {brands.slice(0, 6).map((brand) => (
                    <Link key={brand.slug} href={`/search?q=${encodeURIComponent(brand.name)}`} className="chip shrink-0">
                      {brand.name}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="relative min-h-[200px] overflow-hidden rounded-card border border-navy-100 bg-navy-900 sm:min-h-[280px] lg:min-h-[420px]">
            <Image
              src={img(photo.warehouseShelves, 1400, 1600)}
              alt="Shelves of industrial stock in a warehouse"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-900/90 via-brand-900/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-7">
              <StatRow stats={inventoryStats} />
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-brand-200">
                Industrial stock, ready to browse
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <SectionHeading
            eyebrow="Available stock"
            title="Explore industrial products"
            description="Browse industrial equipment, spare parts and tools available to buy or enquire about."
          />
          <div className="mt-8">
            <ClearanceStockTabs productsByTab={productsByTab} />
          </div>
        </div>
      </section>

      {brands.length ? <section className="section">
        <div className="shell">
          <SectionHeading
            eyebrow="Browse by brand"
            title="Products by manufacturer"
            description="Browse products from the manufacturers represented in our catalogue."
            action={{ label: "All brands", href: "/brands" }}
          />
          <div className="brand-grid mt-6 sm:mt-8">
            {brands.slice(0, 8).map((brand) => (
              <BrandCard key={brand.slug} brand={brand} count={countByBrand(products, brand.name)} />
            ))}
          </div>
        </div>
      </section> : null}

      <section className="section border-y border-navy-100 bg-navy-50">
        <div className="shell">
          <BulkDealSection />
        </div>
      </section>

    </>
  );
}
