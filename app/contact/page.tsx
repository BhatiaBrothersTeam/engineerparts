import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { IconTile } from "@/components/ui/IconTile";
import { ContactForm } from "@/components/forms/ContactForm";
import { CONTACT_EMAIL, CONTACT_PHONE, WHATSAPP_NUMBER, whatsappLink } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact the Engineerparts.com team with a general question or request.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "Contact" }]}
        eyebrow="Clearance desk"
        title="Talk to Engineerparts.com"
        description="Send our team a general message. For a specific product, lot or equipment request, use the enquiry option on its listing."
      />

      <section className="section">
        <div className="shell max-w-3xl">
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {CONTACT_EMAIL ? (
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="card card-interactive flex items-start gap-3 p-4"
              >
                <IconTile>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </IconTile>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-steel-500">Email</span>
                  <span className="mt-0.5 block truncate text-sm font-semibold text-navy-900">{CONTACT_EMAIL}</span>
                </span>
              </a>
            ) : null}
            {CONTACT_PHONE ? (
              <a href={`tel:${CONTACT_PHONE}`} className="card card-interactive flex items-start gap-3 p-4">
                <IconTile>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path d="M4.5 4.5h3.2l1.6 4-2 1.6a11 11 0 0 0 5.6 5.6l1.6-2 4 1.6v3.2a1 1 0 0 1-1 1A15.5 15.5 0 0 1 3.5 5.5a1 1 0 0 1 1-1Z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </IconTile>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-steel-500">Phone</span>
                  <span className="mt-0.5 block truncate text-sm font-semibold text-navy-900">{CONTACT_PHONE}</span>
                </span>
              </a>
            ) : null}
            {WHATSAPP_NUMBER ? (
              <a
                href={whatsappLink("Hello Engineerparts.com")}
                target="_blank"
                rel="noopener noreferrer"
                className="card card-interactive flex items-start gap-3 p-4"
              >
                <IconTile>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.74.46 3.44 1.32 4.94L2 22l5.36-1.4a9.9 9.9 0 0 0 4.68 1.2h.01c5.43 0 9.84-4.4 9.84-9.84C21.89 6.4 17.47 2 12.04 2Z" />
                  </svg>
                </IconTile>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-steel-500">WhatsApp</span>
                  <span className="mt-0.5 block text-sm font-semibold text-navy-900">Message the desk</span>
                </span>
              </a>
            ) : null}
            {!CONTACT_EMAIL && !CONTACT_PHONE && !WHATSAPP_NUMBER ? (
              <p className="text-sm text-steel-600">Use the contact form below to reach our team.</p>
            ) : null}
          </div>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
