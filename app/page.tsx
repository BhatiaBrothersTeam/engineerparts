import Image from "next/image";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatRow } from "@/components/ui/StatRow";
import { IconTile } from "@/components/ui/IconTile";
import { BrandCard } from "@/components/cards/BrandCard";
import { ClearanceStockTabs } from "@/components/home/ClearanceStockTabs";
import { ClearanceAlerts } from "@/components/home/ClearanceAlerts";
import { brandsFromProducts } from "@/lib/data/brands";
import { img, photo } from "@/lib/images";
import { formatNumber } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { getProducts } from "@/lib/woocommerce";

const WHY_US = [
  {
    title: "Verified listings",
    copy: "Condition, specification and stock details are published with every available item.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Dedicated clearance desk",
    copy: "A team that responds to enquiries, confirms stock and arranges collection or freight.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M4 5h16M4 12h16M4 19h10" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Freight & logistics support",
    copy: "From single parts to palletised equipment, we help arrange delivery to your site.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="7.5" cy="18" r="1.6" />
        <circle cx="17.5" cy="18" r="1.6" />
      </svg>
    ),
  },
  {
    title: "Built for business buyers",
    copy: "Bulk quantities, lots and equipment enquiries are handled with trade pricing in mind.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M4 21V9l8-5 8 5v12M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

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
      .filter((product) => product.listing_type === "Whole Lot" || product.category === "lots-bulk-clearance" || (product.quantity_available ?? 0) >= 200)
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
              <Link href="/enquiry" className="btn-outline">
                Submit an Enquiry
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
              <StatRow stats={inventoryStats} />
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-brand-200">
                Industrial stock, ready to browse
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-alt section">
        <div className="shell">
          <SectionHeading
            eyebrow="Why Engineerparts.com"
            title="Built for industrial buyers"
            description="The clearance desk and catalogue are set up around how business buyers actually source parts and equipment."
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_US.map((item) => (
              <div key={item.title} className="card relative overflow-hidden p-6">
                <span className="absolute inset-x-0 top-0 h-1 bg-brand-600" aria-hidden="true" />
                <IconTile size="lg">{item.icon}</IconTile>
                <h3 className="mt-5 text-lg font-bold text-navy-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-steel-600">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <SectionHeading
            eyebrow="Available stock"
            title="Explore industrial products"
            description="Browse industrial equipment, spare parts and tools available to buy or enquire about."
            action={{ label: "Browse all", href: "/clearance" }}
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
