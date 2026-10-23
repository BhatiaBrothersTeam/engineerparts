import type { Metadata } from "next";
import { ListingEnquiryForm } from "@/components/forms/ListingEnquiryForm";
import { PageHero } from "@/components/ui/PageHero";
import { IconTile } from "@/components/ui/IconTile";
import { CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Submit an Enquiry",
  description: "Send Engineerparts.com a product, lot, or equipment enquiry.",
};

export default function EnquiryPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "Enquiry" }]}
        eyebrow="Clearance desk"
        title="Submit an enquiry"
        description="Tell us what products, lots or equipment you need. Add a SKU or reference if you have one."
      />
      <section className="section">
        <div className="shell grid items-start gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.9fr)]">
          <ListingEnquiryForm />
          <aside className="card space-y-5 p-5 lg:sticky lg:top-36">
            <h2 className="text-sm font-bold uppercase tracking-wide text-navy-900">What happens next</h2>
            <ol className="space-y-4 text-sm">
              <li className="flex gap-3">
                <IconTile>
                  <InboxIcon />
                </IconTile>
                <span className="pt-1 text-steel-600"><span className="font-semibold text-navy-900">We log your request</span> &mdash; you&apos;ll get a reference number instantly.</span>
              </li>
              <li className="flex gap-3">
                <IconTile>
                  <SearchIcon />
                </IconTile>
                <span className="pt-1 text-steel-600"><span className="font-semibold text-navy-900">Our desk checks stock</span> &mdash; pricing, lead time and availability are confirmed.</span>
              </li>
              <li className="flex gap-3">
                <IconTile>
                  <ReplyIcon />
                </IconTile>
                <span className="pt-1 text-steel-600"><span className="font-semibold text-navy-900">We get back to you</span> &mdash; within the next working day by email or phone.</span>
              </li>
            </ol>
            {CONTACT_EMAIL || CONTACT_PHONE ? (
              <div className="border-t border-navy-100 pt-4 text-xs text-steel-600">
                <p className="font-semibold text-navy-800">Prefer to talk to someone now?</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {CONTACT_EMAIL ? <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> : null}
                  {CONTACT_PHONE ? <a className="underline" href={`tel:${CONTACT_PHONE}`}>{CONTACT_PHONE}</a> : null}
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </section>
    </>
  );
}

function InboxIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M4 12h4l2 3h4l2-3h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 12 5.5 5h13L20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6z" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}

function ReplyIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M9 10 4 14l5 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 14h10a6 6 0 0 0 6-6V6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
