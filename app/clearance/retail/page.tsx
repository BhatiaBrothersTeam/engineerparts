import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { ClearanceBrowser } from "@/components/clearance/ClearanceBrowser";
import { TrackView } from "@/components/TrackView";
import { buildFacets } from "@/lib/facets";
import { formatNumber } from "@/lib/utils";
import { splitByChannel } from "@/lib/wholesale";
import { getProducts } from "@/lib/woocommerce";

export const metadata: Metadata = {
  title: "Retail Clearance Stock",
  description: "Browse individually priced clearance and surplus stock, available to buy online or enquire about.",
};

export default async function RetailClearancePage() {
  const products = await getProducts();
  const { retail } = splitByChannel(products);
  const facets = buildFacets(retail);

  return (
    <>
      <TrackView event="category_view" payload={{ category: "retail", count: retail.length }} />
      <PageHero
        breadcrumbs={[{ label: "Clearance Stock", href: "/clearance" }, { label: "Retail" }]}
        eyebrow="Clearance stock · Retail"
        title="Retail clearance stock"
        description="Individually priced surplus, aged and clearance stock. Buy online or send an enquiry on any listing."
        stats={[[formatNumber(retail.length), "Listings"]]}
      />
      <section className="section">
        <div className="shell">
          <ClearanceBrowser items={retail} facets={facets} />
        </div>
      </section>
    </>
  );
}
