import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { IconTile } from "@/components/ui/IconTile";
import { CONTACT_EMAIL, whatsappLink } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Answers to common questions about ordering, delivery, returns and enquiries on Engineerparts.com.",
};

const SECTION_ICON: Record<string, React.ReactNode> = {
  "Orders and accounts": (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
    </svg>
  ),
  "Payments and pricing": (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
      <path d="M2.5 9.5h19" strokeLinecap="round" />
    </svg>
  ),
  "Stock, condition and specifications": (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
    </svg>
  ),
  Delivery: (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7.5" cy="18" r="1.6" />
      <circle cx="17.5" cy="18" r="1.6" />
    </svg>
  ),
  "Returns and refunds": (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M4 12a8 8 0 1 1 2.5 5.8M4 12v5M4 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const FAQ_SECTIONS: { title: string; items: { q: string; a: string }[] }[] = [
  {
    title: "Orders and accounts",
    items: [
      {
        q: "Do I need an account to place an order?",
        a: "You can check out without an account. Creating one lets you track orders, save addresses and reorder faster.",
      },
      {
        q: "Can I change or cancel an order after placing it?",
        a: "Contact our team as soon as possible with your order number. We can usually amend or cancel an order before it has been picked and dispatched; once it has shipped, our Returns & Refunds Policy applies.",
      },
      {
        q: "Can I get a quotation instead of ordering online?",
        a: "Yes. Use the enquiry option on a listing, or our contact form, for bulk quantities, equipment and lots, and we will respond with pricing and lead time.",
      },
    ],
  },
  {
    title: "Payments and pricing",
    items: [
      {
        q: "What payment methods are accepted?",
        a: "Accepted payment methods are shown at checkout and may include major cards and other methods we support from time to time.",
      },
      {
        q: "Do listed prices include tax?",
        a: "Where applicable, tax is shown separately at checkout or included in the listed price as stated on the product page. An invoice is provided with your order confirmation.",
      },
    ],
  },
  {
    title: "Stock, condition and specifications",
    items: [
      {
        q: "What does the condition shown on a listing mean?",
        a: "Condition, condition notes, warehouse location and lead time are shown on a listing only when that information has been supplied for that item. Contact us if you need more detail before ordering.",
      },
      {
        q: "What happens if an item goes out of stock after I order it?",
        a: "We will contact you before dispatch to offer a refund, an equivalent substitute, or to hold the order until stock is available. See our Shipping & Delivery Policy for details.",
      },
    ],
  },
  {
    title: "Delivery",
    items: [
      {
        q: "How long does delivery take?",
        a: "Standard items typically dispatch within 1–3 working days. Equipment, lots and large or palletised items may need freight booking and a longer, individually confirmed lead time. See our Shipping & Delivery Policy.",
      },
      {
        q: "Do you deliver internationally or arrange freight for large equipment?",
        a: "Reach out through the enquiry form or contact page with your destination and the item details, and our team will confirm delivery options and cost.",
      },
    ],
  },
  {
    title: "Returns and refunds",
    items: [
      {
        q: "Can I return a product?",
        a: "Unused items in original packaging can usually be returned within 7 days of delivery. Some categories, including clearance stock sold as-is and used consumables, are not returnable unless defective or incorrect on arrival. See our Returns & Refunds Policy.",
      },
      {
        q: "How long do refunds take?",
        a: "Approved refunds are issued to the original payment method, typically within 5–14 working days of the return being received and inspected.",
      },
      {
        q: "What if my order arrives damaged or incorrect?",
        a: "Notify us within 48 hours of delivery with your order number, photos and a description of the issue, and we will arrange a replacement, repair or refund.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "FAQ" }]}
        eyebrow="Support"
        title="Frequently Asked Questions"
        description="Common questions about ordering, delivery, returns and enquiries. Contact us if you can't find what you're looking for."
        tone="light"
      />
      <section className="section pt-8">
        <div className="shell reading space-y-10">
          {FAQ_SECTIONS.map((section) => (
            <div key={section.title}>
              <div className="flex items-center gap-3">
                {SECTION_ICON[section.title] ? <IconTile>{SECTION_ICON[section.title]}</IconTile> : null}
                <h2 className="text-h3 text-navy-900">{section.title}</h2>
              </div>
              <div className="mt-4 space-y-4">
                {section.items.map((item) => (
                  <div key={item.q} className="card card-interactive p-5">
                    <h3 className="text-h4 text-navy-900">{item.q}</h3>
                    <p className="mt-2 text-base leading-relaxed text-steel-700">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-card border border-navy-100 bg-navy-50/50 p-6 text-base leading-relaxed text-steel-700">
            Still have a question? Use our{" "}
            <a className="underline" href="/contact">contact form</a>
            {CONTACT_EMAIL ? <>, email <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></> : null}, or{" "}
            <a className="underline" href={whatsappLink("Hello, I have a question")} target="_blank" rel="noopener noreferrer">
              message us on WhatsApp
            </a>
            .
          </div>
        </div>
      </section>
    </>
  );
}
