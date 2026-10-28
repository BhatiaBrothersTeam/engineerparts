import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { PolicyLayout } from "@/components/ui/PolicyLayout";
import { IconTile } from "@/components/ui/IconTile";
import { CONTACT_EMAIL, CONTACT_PHONE, whatsappLink } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Returns & Refunds Policy",
  description: "How returns, replacements and refunds are handled on Engineerparts.com.",
};

const HIGHLIGHTS = [
  {
    title: "7-day return window",
    copy: "Unused, resalable items in original packaging.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3.5" y="4.5" width="17" height="16" rx="2" />
        <path d="M3.5 9.5h17M8 3v3M16 3v3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "48-hour claim window",
    copy: "Report damaged, defective or wrong items fast.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "5–14 day refunds",
    copy: "Issued to your original payment method.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M4 12a8 8 0 1 1 2.5 5.8M4 12v5M4 12H9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function ReturnsRefundsPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "Returns & Refunds Policy" }]}
        eyebrow="Legal"
        title="Returns & Refunds Policy"
        description="What to do if an order arrives damaged, defective, incorrect or otherwise needs to be returned."
        tone="light"
      />
      <PolicyLayout current="/returns-refunds">
          <div className="grid gap-3 sm:grid-cols-3 sm:gap-5">
            {HIGHLIGHTS.map((item) => (
              <div key={item.title} className="card flex gap-4 p-4 sm:block sm:p-5">
                <IconTile>{item.icon}</IconTile>
                <div className="min-w-0">
                  <h2 className="text-h4 text-navy-900 sm:mt-3">{item.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-steel-600">{item.copy}</p>
                </div>
              </div>
            ))}
          </div>
        <div className="policy-grid mt-4 sm:mt-5">
          <div>
            <h2 className="text-h3 text-navy-900">Return window</h2>
            <p className="mt-2">
              Unused, resalable items in their original packaging can be returned within 7 days of
              delivery, provided the order reference is quoted. Equipment, lots and made-to-order or
              custom-sourced items are returnable only where agreed in writing before dispatch.
            </p>
          </div>

          <div>
            <h2 className="text-h3 text-navy-900">Items that cannot be returned</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Products installed, used or altered after delivery.</li>
              <li>Clearance stock sold as-is where the listing states the item is non-returnable.</li>
              <li>Opened consumables, seals, gaskets, electricals and safety-critical parts, unless defective or incorrect on arrival.</li>
              <li>Items without their original packaging, labels, accessories or documentation.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-h3 text-navy-900">Damaged, defective or wrong items</h2>
            <p className="mt-2">
              Check the shipment against the invoice on arrival. If an item is damaged, defective,
              missing or does not match the order, notify us within 48 hours of delivery with your
              order number, photos of the item and packaging, and a description of the issue. We will
              arrange a replacement, repair or refund once the claim is reviewed.
            </p>
          </div>

          <div>
            <h2 className="text-h3 text-navy-900">Return conditions</h2>
            <p className="mt-2">
              Approved returns must be unused, in their original packaging, with all accessories,
              manuals and freebies included. We may refuse a return that does not meet these
              conditions or that is reported outside the applicable window.
            </p>
          </div>

          <div>
            <h2 className="text-h3 text-navy-900">Refunds</h2>
            <p className="mt-2">
              Approved refunds are issued to the original payment method, typically within 5–14
              working days of the returned item being received and inspected. Freight, handling and
              any payment gateway fees are non-refundable unless the error was ours.
            </p>
          </div>

          <div>
            <h2 className="text-h3 text-navy-900">Return logistics</h2>
            <p className="mt-2">
              Once a return is approved, we will confirm the drop-off or collection arrangement.
              Return freight is charged to the customer unless the fault is ours.
            </p>
          </div>

          <div>
            <h2 className="text-h3 text-navy-900">Exchanges</h2>
            <p className="mt-2">
              Exchanges for the same item are offered where stock allows, subject to the conditions
              above.
            </p>
          </div>

          <div>
            <h2 className="text-h3 text-navy-900">Need help with a return?</h2>
            <p className="mt-2">
              Contact our team with your order reference{CONTACT_EMAIL ? <> at <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></> : null}
              {CONTACT_PHONE ? <> or call <a className="underline" href={`tel:${CONTACT_PHONE}`}>{CONTACT_PHONE}</a></> : null}, or{" "}
              <a className="underline" href={whatsappLink("Hello, I need help with a return")} target="_blank" rel="noopener noreferrer">
                message us on WhatsApp
              </a>
              . Your statutory rights under applicable consumer protection law are not affected by
              this policy.
            </p>
          </div>
        </div>
      </PolicyLayout>
    </>
  );
}
