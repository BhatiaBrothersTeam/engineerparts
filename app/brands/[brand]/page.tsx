import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui/PageHero";
import { IconTile } from "@/components/ui/IconTile";
import { ProductCard } from "@/components/cards/ProductCard";
import { TrackView } from "@/components/TrackView";
import { getBrand, productsForBrand } from "@/lib/data/brands";
import { formatNumber } from "@/lib/utils";
import { getProducts } from "@/lib/woocommerce";

export async function generateMetadata({ params }: { params: { brand: string } }): Promise<Metadata> {
  const products = await getProducts();
  const brand = getBrand(products, params.brand);
  if (!brand) return { title: "Brand not found" };
  return {
    title: `${brand.name} clearance stock`,
    description: brand.description,
    alternates: { canonical: `/brands/${brand.slug}` },
    openGraph: {
      title: `${brand.name} clearance stock`,
      description: brand.description,
      url: `/brands/${brand.slug}`,
      type: "website",
    },
  };
}

export default async function BrandPage({ params }: { params: { brand: string } }) {
  const products = await getProducts();
  const brand = getBrand(products, params.brand);
  if (!brand) notFound();

  const items = productsForBrand(products, brand.slug);
  const brandUrl = `https://engineerparts.com/brands/${brand.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: `${brand.name} clearance stock`,
        url: brandUrl,
        description: brand.description,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://engineerparts.com" },
          { "@type": "ListItem", position: 2, name: "Brands", item: "https://engineerparts.com/brands" },
          { "@type": "ListItem", position: 3, name: brand.name, item: brandUrl },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <TrackView event="brand_view" payload={{ brand: brand.slug, count: items.length }} />
      <PageHero
        breadcrumbs={[{ label: "Brands", href: "/brands" }, { label: brand.name }]}
        eyebrow="Brand clearance"
        title={brand.name}
        description={brand.description}
        stats={[[formatNumber(items.length), "Listings"]]}
      />

      <section className="section">
        <div className="shell">
          <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
            <IconTile>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M12 9v4m0 4h.01M10.3 3.9 2.6 17.5a1.8 1.8 0 0 0 1.56 2.7h15.68a1.8 1.8 0 0 0 1.56-2.7L13.7 3.9a1.8 1.8 0 0 0-3.4 0Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </IconTile>
            <div>
              <p className="text-sm font-semibold text-navy-900">
                {brand.name} appears on this site because we hold surplus, aged or discontinued stock.
              </p>
              <p className="mt-1 text-xs leading-relaxed text-steel-600">
                Engineerparts.com does not claim an official distribution relationship with {brand.name}.
                Brand names appear because they are on the physical surplus items we hold.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {brand.sectors.map((sector) => (
                  <span key={sector} className="chip">
                    {sector}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {items.length ? (
            <div className="mt-8 product-grid">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="card mx-auto mt-8 flex max-w-xl flex-col items-center p-10 text-center">
              <IconTile>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                </svg>
              </IconTile>
              <p className="mt-4 text-base font-bold text-navy-900">No {brand.name} product listings at the moment</p>
              <p className="mt-2 max-w-md text-sm text-steel-600">
                Stock rotates. Send an enquiry and we will check warehouse holdings not yet listed.
              </p>
              <Link href="/contact" className="btn-navy btn-sm mt-5 inline-flex">
                Send an enquiry
              </Link>
            </div>
          )}

          <div className="mt-10">
            <Link href="/brands" className="link-underline text-sm font-semibold text-brand-700 hover:text-brand-500">
              &larr; All brands
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
