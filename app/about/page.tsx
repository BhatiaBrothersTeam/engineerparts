import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { WhyEngineerparts } from "@/components/home/WhyEngineerparts";

export const metadata: Metadata = {
  title: "About",
  description: "Learn how Engineerparts.com helps business buyers find industrial products, spare parts, tools and clearance stock.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "About" }]}
        eyebrow="About Engineerparts.com"
        title="About Engineerparts.com"
        description="Industrial equipment, spare parts and tools for business buyers."
      />

      <section className="section">
        <div className="shell grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="reading">
            <p className="eyebrow text-brand-600">Who we are</p>
            <h2 className="text-h2 mt-2 text-navy-900">
              Company overview
            </h2>
            <p className="mt-4 text-base leading-relaxed text-steel-700">
              Engineerparts.com helps business buyers browse industrial equipment, spare parts, tools and engineering products, including available clearance stock.
            </p>
            <p className="mt-3 text-base leading-relaxed text-steel-700">
              Listings can be purchased online where available or sent to our team as a product, equipment or bulk enquiry.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="card p-5 sm:p-6">
              <h3 className="text-h3 text-navy-900">Our mission</h3>
              <p className="mt-3 text-sm leading-relaxed text-steel-600">
                Make industrial products and available clearance stock easier for businesses to discover and source.
              </p>
            </article>
            <article className="card p-5 sm:p-6">
              <h3 className="text-h3 text-navy-900">Our vision</h3>
              <p className="mt-3 text-sm leading-relaxed text-steel-600">
                Help businesses find parts and equipment they need, including surplus and clearance inventory.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="shell grid gap-4 sm:grid-cols-2">
          <article className="card p-5 sm:p-6">
            <h2 className="text-h3 text-navy-900">Our inventory</h2>
            <p className="mt-3 text-base leading-relaxed text-steel-700">
              Browse industrial equipment, spare parts, tools and clearance stock. Listings show current product information; availability and quantities can change, so contact us to confirm before ordering.
            </p>
          </article>
          <article className="card p-5 sm:p-6">
            <h2 className="text-h3 text-navy-900">Quality assurance</h2>
            <p className="mt-3 text-base leading-relaxed text-steel-700">
              Products are organised by category and brand. Condition, specifications, quantity and location are shown when those details are available for a listing. Ask our team to confirm item-specific details or arrange an inspection before purchase.
            </p>
          </article>
        </div>
      </section>

      <section className="section-alt section">
        <div className="shell">
          <WhyEngineerparts />
        </div>
      </section>

      <section className="section">
        <div className="shell grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="eyebrow text-brand-600">Logistics &amp; delivery</p>
            <h2 className="text-h2 mt-2 text-navy-900">From enquiry to collection or delivery</h2>
            <ol className="mt-5 space-y-4 text-base leading-relaxed text-steel-700">
              <li><span className="font-semibold text-navy-900">1. Share your requirement.</span> Include the product reference, quantity and destination.</li>
              <li><span className="font-semibold text-navy-900">2. Confirm the order.</span> Our team checks availability and discusses the applicable price and delivery options.</li>
              <li><span className="font-semibold text-navy-900">3. Arrange fulfilment.</span> UAE-wide delivery and collection by appointment are available; confirm arrangements with our team before ordering.</li>
            </ol>
          </div>
          <div className="rounded-card border border-navy-100 bg-white p-6 shadow-card">
            <h3 className="text-h3 text-navy-900">Why choose Engineer Parts?</h3>
            <p className="mt-3 text-base leading-relaxed text-steel-700">
              Browse real listings with item-level details, compare available stock, and contact our team about individual products or bulk requirements. We make missing or unconfirmed details clear so you can ask before proceeding.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/clearance" className="btn-primary">
                Browse clearance
              </Link>
              <Link href="/contact" className="btn-outline">
                Contact the desk
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
