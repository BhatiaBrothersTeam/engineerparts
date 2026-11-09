import Image from "next/image";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatRow } from "@/components/ui/StatRow";
import { Reveal, RevealGroup } from "@/components/ui/Reveal";
import { BrandCard } from "@/components/cards/BrandCard";
import { CategoryShowcaseCard } from "@/components/cards/CategoryShowcaseCard";
import { WholesaleProductCard } from "@/components/cards/WholesaleProductCard";
import { ClearanceStockTabs } from "@/components/home/ClearanceStockTabs";
import { BulkDealSection } from "@/components/home/BulkDealSection";
import { WhyEngineerparts } from "@/components/home/WhyEngineerparts";
import { HeroActionMotion, HeroImageMotion } from "@/components/home/HeroMotion";
import { categorySummary } from "@/lib/categories";
import { brandsFromProducts } from "@/lib/data/brands";
import { img, photo } from "@/lib/images";
import { formatNumber } from "@/lib/utils";
import { isWholesaleProduct } from "@/lib/wholesale";
import type { Product } from "@/lib/types";
import { getProducts } from "@/lib/woocommerce";

function countByBrand(products: Awaited<ReturnType<typeof getProducts>>, name: string) {
  return products.filter((p) => p.brand === name).length;
}

const CATEGORY_TONES = [
  "bg-brand-50",
  "bg-navy-50",
  "bg-brand-100/70",
  "bg-steel-50",
  "bg-navy-100/70",
  "bg-brand-50/80",
] as const;

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
  const brands = brandsFromProducts(available);
  const clearanceLots = available.filter(isWholesaleProduct).slice(0, 4);
  const categories = categorySummary(available).slice(0, 6).map((category) => ({
    ...category,
    imageProduct: available.find((product) => product.category === category.slug && product.images.length > 0),
  }));
  const categoryCount = new Set(available.map((product) => product.category).filter((category) => category && category !== "uncategorised")).size;
  const inventoryStats = [
    ...(available.length ? [[formatNumber(available.length), "Listings"]] : []),
    ...(brands.length ? [[formatNumber(brands.length), "Brands"]] : []),
    ...(categoryCount ? [[formatNumber(categoryCount), "Categories"]] : []),
  ] as [string, string][];

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-navy-100 bg-gradient-to-br from-white via-brand-50/40 to-white">
        <div aria-hidden className="soft-glow pointer-events-none absolute -left-40 -top-56 h-[30rem] w-[30rem] rounded-full bg-brand-200/50 blur-3xl" />
        <div aria-hidden className="soft-glow pointer-events-none absolute -bottom-64 right-[-8rem] h-[34rem] w-[34rem] rounded-full bg-brand-100/70 blur-3xl [animation-delay:-3s]" />
        <div className="shell relative grid grid-cols-[minmax(0,1fr)] items-stretch gap-7 py-7 sm:gap-8 sm:py-10 lg:grid-cols-2 lg:gap-12 lg:py-12">
          <div className="min-w-0 flex flex-col justify-center">
            <p className="eyebrow hero-rise text-brand-600">Engineer Parts &nbsp;|&nbsp; Industrial supplier</p>
            <h1 className="text-display hero-rise mt-4 text-navy-900 [animation-delay:90ms]">
              Industrial parts.
              <br />
              Equipment and tools.
              <br />
              <span className="text-brand-600">Ready to source.</span>
            </h1>
            <p className="text-lead hero-rise mt-4 max-w-2xl text-steel-600 [animation-delay:180ms] sm:mt-5">
              Find industrial equipment, spare parts and tools. Buy available clearance stock online or send our team an enquiry.
            </p>

            <div className="hero-rise mt-6 grid grid-cols-1 gap-3 [animation-delay:270ms] min-[400px]:grid-cols-2 sm:mt-7 sm:flex sm:flex-wrap">
              <HeroActionMotion>
                <Link href="/clearance" className="btn-primary w-full">
                  Browse Clearance Stock
                </Link>
              </HeroActionMotion>
              <HeroActionMotion>
                <Link href="/enquiry" className="btn-outline w-full">
                  Submit an Enquiry
                </Link>
              </HeroActionMotion>
            </div>

            <div className="hero-rise mt-7 [animation-delay:360ms] sm:mt-8">
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

          <HeroImageMotion>
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
          </HeroImageMotion>
        </div>
      </section>

      {categories.length ? (
        <section className="section overflow-hidden">
          <div className="shell">
            <Reveal>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow flex items-center gap-3 text-brand-700">
                    <span className="h-px w-7 bg-brand-400" aria-hidden />
                    Explore the range
                  </p>
                  <h2 className="text-h2 mt-3 text-navy-900">Shop by category</h2>
                </div>
                <Link
                  href="/categories"
                  className="group inline-flex min-h-11 w-fit items-center gap-3 rounded-full border border-navy-200 bg-white px-5 py-2.5 text-sm font-semibold text-navy-900 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift"
                >
                  View all categories
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-900 text-white transition-transform duration-300 group-hover:translate-x-1">
                    &rarr;
                  </span>
                </Link>
              </div>
            </Reveal>

            <div className="mt-7 grid gap-4 md:grid-cols-6 lg:mt-9">
              {categories.map((category, index) => (
                <Reveal
                  key={category.slug}
                  delay={index * 70}
                  className="h-full md:col-span-2"
                >
                  <CategoryShowcaseCard
                    category={category}
                    image={category.imageProduct?.images[0]}
                    tone={CATEGORY_TONES[index]}
                    className="h-full"
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="shell">
          <SectionHeading
            eyebrow="Live clearance stock"
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
            action={{ label: "Explore All Brands", href: "/brands" }}
          />
          <RevealGroup className="brand-grid mt-6 sm:mt-8">
            {brands.slice(0, 8).map((brand) => (
              <BrandCard key={brand.slug} brand={brand} count={countByBrand(products, brand.name)} />
            ))}
          </RevealGroup>
        </div>
      </section> : null}

      {clearanceLots.length ? (
        <section className="section border-y border-navy-100 bg-navy-50">
          <div className="shell">
            <SectionHeading
              eyebrow="Clearance lots"
              title="Bulk quantities and surplus stock"
              description="Explore high-quantity inventory and whole-lot opportunities from the live catalogue."
              action={{ label: "Browse wholesale stock", href: "/clearance/wholesale" }}
            />
            <RevealGroup className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:mt-8 lg:grid-cols-4 lg:gap-5">
              {clearanceLots.map((product) => (
                <WholesaleProductCard key={product.id} product={product} />
              ))}
            </RevealGroup>
          </div>
        </section>
      ) : null}

      <section className="section section-alt">
        <div className="shell">
          <WhyEngineerparts />
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <SectionHeading
            eyebrow="How it works"
            title="From browsing to delivery"
            description="A clear path from finding stock to arranging your order."
          />
          <ol className="mt-6 grid gap-4 sm:mt-8 md:grid-cols-3">
            {[
              ["Browse available stock", "Search products by category, brand, condition or quantity."],
              ["Enquire or place a request", "Send the product reference and quantity your business needs."],
              ["Confirm delivery or collection", "Our team confirms availability and discusses delivery or collection by appointment."],
            ].map(([title, copy], index) => (
              <li key={title}>
                <Reveal delay={index * 90} className="h-full">
                  <div className="card card-interactive flex h-full gap-4 p-5 sm:p-6">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-h4 text-navy-900">{title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-steel-600">{copy}</p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section border-y border-navy-100 bg-navy-50">
        <div className="shell">
          <BulkDealSection />
        </div>
      </section>

    </>
  );
}
