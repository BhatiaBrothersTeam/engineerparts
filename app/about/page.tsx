import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { WhyEngineerparts } from "@/components/home/WhyEngineerparts";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about Engineerparts.com and browse industrial products, spare parts, tools and clearance stock.",
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
        <div className="shell reading">
          <div>
            <p className="eyebrow text-brand-600">Who we are</p>
            <h2 className="text-h2 mt-2 text-navy-900">
              Industrial products for business buyers
            </h2>
            <p className="mt-4 text-base leading-relaxed text-steel-700">
              Engineerparts.com helps businesses browse industrial equipment, spare parts, tools and engineering products, including available clearance stock.
            </p>
            <p className="mt-3 text-base leading-relaxed text-steel-700">
              We deal in surplus stock, dead stock and engineered parts &mdash; aged and clearance inventory offered
              individually at retail or in bulk quantities for wholesale buyers.
            </p>
            <p className="mt-3 text-base leading-relaxed text-steel-700">
              Review the information published with each listing, buy eligible items online, or contact our team when you need more details before making a decision.
            </p>
          </div>
        </div>
      </section>

      <section className="section-alt section">
        <div className="shell">
          <WhyEngineerparts />
        </div>
      </section>

      <section className="section">
        <div className="shell grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-h2 text-navy-900">How listings work</h2>
            <ul className="mt-5 space-y-3 text-base leading-relaxed text-steel-700">
              <li>Product listings show available information, pricing and stock details.</li>
              <li>Stock quantity is shown when it is available for a listing.</li>
              <li>Condition, location and lead time are shown only when supplied.</li>
              <li>Products without enough information remain available for enquiry.</li>
            </ul>
          </div>
          <div className="rounded-card border border-navy-100 bg-white p-6 shadow-card">
            <h3 className="text-h4 text-navy-900">Need more information?</h3>
            <p className="mt-3 text-base leading-relaxed text-steel-700">
              Use the contact form or a product enquiry when a listing does not contain the details you need.
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
