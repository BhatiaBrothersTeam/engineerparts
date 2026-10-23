import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { ClearanceBrowser } from "@/components/clearance/ClearanceBrowser";
import { TrackView } from "@/components/TrackView";
import { brandsFromProducts } from "@/lib/data/brands";
import { buildFacets } from "@/lib/facets";
import { formatNumber } from "@/lib/utils";
import { getProducts } from "@/lib/woocommerce";

export const metadata: Metadata = {
  title: "Clearance Stock",
  description:
    "Browse industrial products and clearance stock. Filter by brand, category, condition, price, quantity and location.",
};

export default async function ClearancePage() {
  const products = await getProducts();
  const brands = brandsFromProducts(products);
  const categoryCount = new Set(products.map((product) => product.category).filter((category) => category !== "uncategorised")).size;
  const facets = buildFacets(products);

  return (
    <>
      <TrackView event="category_view" payload={{ category: "all-clearance", count: products.length }} />
      <PageHero
        breadcrumbs={[{ label: "Clearance Stock" }]}
        eyebrow="Clearance stock"
        title="Industrial product catalogue"
        description="Browse industrial products and clearance stock by brand, category, condition, price, quantity and location."
        stats={[
          ...(products.length ? [[formatNumber(products.length), "Listings"] as [string, string]] : []),
          ...(categoryCount ? [[String(categoryCount), "Categories"] as [string, string]] : []),
          ...(brands.length ? [[String(brands.length), "Brands"] as [string, string]] : []),
        ]}
      />

      <section className="section">
        <div className="shell">
          <ClearanceBrowser items={products} facets={facets} />
        </div>
      </section>
    </>
  );
}
