import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { IconTile } from "@/components/ui/IconTile";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about Engineerparts.com and browse industrial products, spare parts, tools and clearance stock.",
};

const CAPABILITIES = [
  {
    title: "Browse products",
    copy: "Explore available industrial products and clearance stock.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    title: "Search",
    copy: "Find listings by name, brand, model, SKU or part number.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m20 20-4.3-4.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Review details",
    copy: "Check the product information and specifications available on each listing.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M6 3.5h9l3.5 3.5V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
        <path d="M8.5 11h7M8.5 14.5h7M8.5 7.5h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Send enquiries",
    copy: "Ask for information that is not available on a listing.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M3.5 13.5V7.5A2 2 0 0 1 5.5 5.5h13a2 2 0 0 1 2 2v6m-17 0V18a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-4.5m-17 0h4l1 2h6l1-2h4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

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
        <div className="shell max-w-3xl">
          <div>
            <p className="eyebrow text-brand-600">Who we are</p>
            <h2 className="mt-2 text-2xl font-extrabold text-navy-900">
              Industrial products for business buyers
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-steel-700">
              Engineerparts.com helps businesses browse industrial equipment, spare parts, tools and engineering products, including available clearance stock.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-steel-700">
              Review the information published with each listing, buy eligible items online, or contact our team when you need more details before making a decision.
            </p>
          </div>
        </div>
      </section>

      <section className="section-alt section">
        <div className="shell">
          <h2 className="text-2xl font-extrabold text-navy-900">What you can do here</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map((item) => (
              <div key={item.title} className="card card-interactive p-5">
                <IconTile>{item.icon}</IconTile>
                <h3 className="mt-4 text-base font-bold text-navy-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-steel-600">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-extrabold text-navy-900">How listings work</h2>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-steel-700">
              <li>Product listings show available information, pricing and stock details.</li>
              <li>Stock quantity is shown when it is available for a listing.</li>
              <li>Condition, location and lead time are shown only when supplied.</li>
              <li>Products without enough information remain available for enquiry.</li>
            </ul>
          </div>
          <div className="rounded-card border border-navy-100 bg-white p-6 shadow-card">
            <h3 className="text-lg font-extrabold text-navy-900">Need more information?</h3>
            <p className="mt-3 text-sm leading-relaxed text-steel-700">
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
