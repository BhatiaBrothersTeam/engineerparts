import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui/PageHero";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { ClearanceBrowser } from "@/components/clearance/ClearanceBrowser";
import { TrackView } from "@/components/TrackView";
import { categorySummary, humanizeCategorySlug } from "@/lib/categories";
import { buildFacets } from "@/lib/facets";
import { formatNumber } from "@/lib/utils";
import { getProducts } from "@/lib/woocommerce";

export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
  const label = humanizeCategorySlug(params.category);
  return {
    title: `${label} clearance stock`,
    description: `Browse ${label.toLowerCase()} clearance and surplus stock from Engineerparts.com.`,
  };
}

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const products = await getProducts();
  const categories = categorySummary(products);
  const category = categories.find((item) => item.slug === params.category);
  if (!category) notFound();

  const items = products.filter((product) => product.category === category.slug);
  const facets = buildFacets(items);

  return (
    <>
      <TrackView event="category_view" payload={{ category: category.slug, count: items.length }} />
      <PageHero
        breadcrumbs={[{ label: "Clearance Stock", href: "/clearance" }, { label: category.label }]}
        eyebrow="Clearance category"
        title={category.label}
        description={`Browse ${category.label.toLowerCase()} clearance and surplus stock currently available.`}
        stats={[[formatNumber(items.length), "Listings"]]}
      >
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-white">
          <CategoryIcon category={category.slug} className="h-7 w-7" />
        </span>
      </PageHero>

      <section className="section">
        <div className="shell">
          {items.length ? (
            <ClearanceBrowser items={items} facets={facets} />
          ) : (
            <div className="card mx-auto mt-8 flex max-w-xl flex-col items-center p-10 text-center">
              <span className="icon-tile">
                <CategoryIcon category={category.slug} className="h-5 w-5" />
              </span>
              <p className="mt-4 text-base font-bold text-navy-900">No {category.label} listings at the moment</p>
              <p className="mt-2 max-w-md text-sm text-steel-600">
                Stock rotates. Send an enquiry and we will check warehouse holdings not yet listed.
              </p>
              <Link href="/contact" className="btn-navy btn-sm mt-5 inline-flex">
                Send an enquiry
              </Link>
            </div>
          )}

          <div className="mt-10">
            <Link href="/clearance" className="link-underline text-sm font-semibold text-brand-700 hover:text-brand-500">
              &larr; All clearance stock
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
