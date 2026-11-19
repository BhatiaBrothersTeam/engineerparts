import type { Metadata } from "next";
import { SavedProductsView } from "@/components/account/SavedProductsView";
import { PageHero } from "@/components/ui/PageHero";
import { getProducts } from "@/lib/woocommerce";

export const metadata: Metadata = { title: "Saved Products", robots: { index: false, follow: false } };

export default async function SavedProductsPage() {
  const products = await getProducts();
  return (
    <>
      <PageHero breadcrumbs={[{ label: "Saved Products" }]} eyebrow="Your shortlist" title="Saved products" description="Products you have saved for later." />
      <section className="section"><div className="shell"><SavedProductsView products={products} /></div></section>
    </>
  );
}
