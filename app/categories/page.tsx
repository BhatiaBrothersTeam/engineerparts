import type { Metadata } from "next";
import Link from "next/link";
import { CategoryBrowser } from "@/components/categories/CategoryBrowser";
import { TrackView } from "@/components/TrackView";
import { PageHero } from "@/components/ui/PageHero";
import { categorySummary } from "@/lib/categories";
import { formatNumber } from "@/lib/utils";
import { getProducts } from "@/lib/woocommerce";

export const metadata: Metadata = {
  title: "Product Categories",
  description: "Browse all industrial product and clearance stock categories.",
};

export default async function CategoriesPage() {
  const products = await getProducts();
  const categories = categorySummary(products).map((category) => ({
    ...category,
    image: products.find((product) => product.category === category.slug && product.images.length > 0)?.images[0],
  }));

  return (
    <>
      <TrackView event="category_view" payload={{ category: "all-categories", count: categories.length }} />
      <PageHero
        breadcrumbs={[{ label: "Categories" }]}
        eyebrow="Product categories"
        title="Browse all categories"
        description="Explore every industrial product category currently represented in our catalogue."
        stats={[
          ...(categories.length ? [[String(categories.length), "Categories"] as [string, string]] : []),
          ...(products.length ? [[formatNumber(products.length), "Listings"] as [string, string]] : []),
        ]}
      />

      <section className="section">
        <div className="shell">
          {categories.length ? (
            <CategoryBrowser categories={categories} />
          ) : (
            <div className="card mx-auto max-w-xl p-8 text-center sm:p-10">
              <h2 className="text-h3 text-navy-900">No categories available</h2>
              <p className="mt-2 text-sm leading-relaxed text-steel-600">
                Stock rotates frequently. Browse the full catalogue or contact us about the products you need.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Link href="/clearance" className="btn-navy btn-sm">Browse clearance stock</Link>
                <Link href="/contact" className="btn-outline btn-sm">Contact us</Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
