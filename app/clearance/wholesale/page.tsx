import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { IconTile } from "@/components/ui/IconTile";
import { WholesaleProductCard } from "@/components/cards/WholesaleProductCard";
import { BulkDealSection } from "@/components/home/BulkDealSection";
import { TrackView } from "@/components/TrackView";
import { formatNumber } from "@/lib/utils";
import { splitByChannel } from "@/lib/wholesale";
import { getProducts } from "@/lib/woocommerce";

export const metadata: Metadata = {
  title: "Wholesale & Bulk Clearance Stock",
  description: "Browse bulk quantities and whole-lot clearance stock. Pricing on request via WhatsApp or email.",
};

export default async function WholesaleClearancePage() {
  const products = await getProducts();
  const { wholesale } = splitByChannel(products);

  return (
    <>
      <TrackView event="category_view" payload={{ category: "wholesale", count: wholesale.length }} />
      <PageHero
        breadcrumbs={[{ label: "Clearance Stock", href: "/clearance" }, { label: "Wholesale" }]}
        eyebrow="Clearance stock · Wholesale"
        title="Wholesale & bulk clearance stock"
        description="Bulk quantities and whole-lot surplus stock. Pricing is not published online — enquire directly by WhatsApp or email and our clearance desk will confirm availability and rates."
        stats={[[formatNumber(wholesale.length), "Bulk listings"]]}
      />

      <section className="section pb-0">
        <div className="shell">
          <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
            <IconTile>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
                <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
                <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
                <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
              </svg>
            </IconTile>
            <div>
              <p className="text-sm font-semibold text-navy-900">No prices are published on wholesale listings.</p>
              <p className="mt-1 text-xs leading-relaxed text-steel-600">
                Wholesale and bulk-lot pricing depends on quantity, condition and current availability. Use the
                WhatsApp or email button on any listing below, or send a full requirement through the bulk enquiry
                form.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          {wholesale.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {wholesale.map((product) => (
                <WholesaleProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="card mx-auto flex max-w-xl flex-col items-center p-10 text-center">
              <IconTile>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                </svg>
              </IconTile>
              <p className="mt-4 text-base font-bold text-navy-900">No wholesale listings at the moment</p>
              <p className="mt-2 max-w-md text-sm text-steel-600">
                Bulk and whole-lot stock rotates quickly. Send your requirement below and we will check warehouse
                holdings not yet listed.
              </p>
            </div>
          )}

          <div className="mt-10">
            <Link href="/clearance" className="link-underline text-sm font-semibold text-brand-700 hover:text-brand-500">
              &larr; All clearance stock
            </Link>
          </div>
        </div>
      </section>

      <section className="section border-y border-navy-800 bg-navy-950">
        <div className="shell">
          <BulkDealSection />
        </div>
      </section>
    </>
  );
}
