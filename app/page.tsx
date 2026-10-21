import Image from "next/image";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BrandCard } from "@/components/cards/BrandCard";
import { ClearanceStockTabs } from "@/components/home/ClearanceStockTabs";
import { ClearanceAlerts } from "@/components/home/ClearanceAlerts";
import { brandsFromProducts } from "@/lib/data/brands";
import { img, photo } from "@/lib/images";
import { formatNumber } from "@/lib/utils";
import { getProducts } from "@/lib/woocommerce";

function countByBrand(products: Awaited<ReturnType<typeof getProducts>>, name: string) {
  return products.filter((p) => p.brand === name).length;
}

export default async function HomePage() {
  const products = await getProducts();
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
        <div className="shell grid grid-cols-[minmax(0,1fr)] items-stretch gap-10 py-12 lg:grid-cols-2 lg:gap-14 lg:py-16">
          <div className="min-w-0 flex flex-col justify-center">
            <p className="eyebrow text-brand-600">Engineerparts.com &middot; Product catalogue</p>
            <h1 className="mt-4 text-[34px] font-extrabold leading-[1.05] tracking-tight text-navy-900 sm:text-5xl lg:text-[54px]">
              Industrial parts.
              <br />
              Equipment and tools.
              <br />
              <span className="text-brand-600">Ready to source.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-steel-600">
              Find industrial equipment, spare parts and tools. Buy available clearance stock online or send our team an enquiry.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/clearance" className="btn-primary">
                Browse Clearance Stock
              </Link>
            </div>

            <div className="mt-8">
              <SearchBar
                variant="hero"
                placeholder="Search by brand, part number, model or product..."
              />
              {brands.length ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-steel-400">
                    Popular
                  </span>
                  {brands.slice(0, 6).map((brand) => (
                    <Link key={brand.slug} href={`/search?q=${encodeURIComponent(brand.name)}`} className="chip">
                      {brand.name}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="relative min-h-[320px] overflow-hidden rounded-card border border-navy-100 bg-navy-900 lg:min-h-[520px]">
            <Image
              src={img(photo.warehouseShelves, 1400, 1600)}
              alt="Shelves of industrial stock in a warehouse"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-950/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {inventoryStats.map(([value, label]) => (
                  <div key={label} className="rounded-md border border-white/10 bg-navy-950/70 px-3.5 py-3 backdrop-blur-md">
                    <p className="text-lg font-extrabold text-white sm:text-xl">{value}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-steel-300">{label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-brand-200">
                Industrial stock, ready to browse
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section border-y border-navy-100 bg-navy-50/50">
        <div className="shell">
          <SectionHeading
            eyebrow="Available stock"
            title="Explore industrial products"
            description="Browse industrial equipment, spare parts and tools available to buy or enquire about."
            action={{ label: "Browse all", href: "/clearance" }}
          />
          <div className="mt-8">
            <ClearanceStockTabs products={products} />
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
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {brands.slice(0, 8).map((brand) => (
              <BrandCard key={brand.slug} brand={brand} count={countByBrand(products, brand.name)} />
            ))}
          </div>
        </div>
      </section> : null}

      <section className="section">
        <div className="shell">
          <ClearanceAlerts />
        </div>
      </section>
    </>
  );
}
