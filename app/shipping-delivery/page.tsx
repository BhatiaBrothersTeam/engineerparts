import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { IconTile } from "@/components/ui/IconTile";
import { CONTACT_EMAIL, CONTACT_PHONE, whatsappLink } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy",
  description: "Delivery coverage, timelines and fees for orders placed on Engineerparts.com.",
};

const HIGHLIGHTS = [
  {
    title: "1–3 day dispatch",
    copy: "Standard items typically ship within 1–3 working days.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="7.5" cy="18" r="1.6" />
        <circle cx="17.5" cy="18" r="1.6" />
      </svg>
    ),
  },
  {
    title: "Freight for equipment",
    copy: "Lots and large items get an individually confirmed lead time.",
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
    title: "48-hour reporting window",
    copy: "Tell us about missing or damaged items quickly.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function ShippingDeliveryPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "Shipping & Delivery Policy" }]}
        eyebrow="Legal"
        title="Shipping & Delivery Policy"
        description="Coverage, timelines and fees for delivery and freight on Engineerparts.com orders."
        tone="light"
      />
      <section className="section pb-0 pt-8">
        <div className="shell max-w-3xl">
          <div className="grid gap-4 sm:grid-cols-3">
            {HIGHLIGHTS.map((item) => (
              <div key={item.title} className="card p-4">
                <IconTile>{item.icon}</IconTile>
                <h2 className="mt-3 text-sm font-bold text-navy-900">{item.title}</h2>
                <p className="mt-1 text-xs leading-relaxed text-steel-600">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="shell prose-sm max-w-3xl space-y-8 text-sm leading-relaxed text-steel-700">
          <div>
            <h2 className="text-lg font-bold text-navy-900">Coverage</h2>
            <p className="mt-2">
              We dispatch orders by courier or freight depending on the size, weight and value of the
              items ordered. Delivery availability and lead time depend on your location and on
              stock, warehouse location and courier or freight-forwarder schedules.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900">Timelines</h2>
            <p className="mt-2">
              Standard items typically dispatch within 1–3 working days of order confirmation.
              Equipment, lots and large or heavy items may require freight booking and a longer,
              individually confirmed lead time. The lead time shown on a listing, where provided, is
              an estimate and not a guaranteed delivery date.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900">Fees</h2>
            <p className="mt-2">
              Delivery and freight charges are shown at checkout or quoted separately for
              equipment and bulk orders, and depend on destination, weight, volume and service
              level. Any additional handling, packing or freight-forwarding charges for
              oversized or palletised items will be confirmed before dispatch.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900">Delivery attempts</h2>
            <p className="mt-2">
              If delivery cannot be completed because no one is available to receive the order,
              the courier or our team will contact you to rearrange delivery. Repeat failed
              attempts, address corrections or storage pending re-delivery may incur additional
              charges.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900">Stock and substitutions</h2>
            <p className="mt-2">
              If an ordered item becomes unavailable after the order is placed, we will contact you
              before dispatch to offer a refund, a substitute of equivalent specification, or to hold
              the order until stock is available. No substitution is made without your confirmation.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900">Checking your delivery</h2>
            <p className="mt-2">
              Inspect the shipment against the packing list at the point of delivery where
              possible. Report missing, incorrect or damaged items within 48 hours, as described in
              our <a className="underline" href="/returns-refunds">Returns &amp; Refunds Policy</a>.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-navy-900">Questions about a delivery</h2>
            <p className="mt-2">
              Contact our team with your order reference{CONTACT_EMAIL ? <> at <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></> : null}
              {CONTACT_PHONE ? <> or call <a className="underline" href={`tel:${CONTACT_PHONE}`}>{CONTACT_PHONE}</a></> : null}, or{" "}
              <a className="underline" href={whatsappLink("Hello, I have a question about my delivery")} target="_blank" rel="noopener noreferrer">
                message us on WhatsApp
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
