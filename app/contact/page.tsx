import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { IconTile } from "@/components/ui/IconTile";
import { ContactForm } from "@/components/forms/ContactForm";
import { CONTACT_EMAIL, CONTACT_PHONE, WHATSAPP_NUMBER, whatsappLink } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact the Engineerparts.com team with a general question or request.",
};

export default function ContactPage() {
  const hasAnyChannel = Boolean(CONTACT_EMAIL || CONTACT_PHONE || WHATSAPP_NUMBER);

  return (
    <>
    
      <PageHero
        breadcrumbs={[{ label: "Contact Us" }]}
        eyebrow="Clearance desk"
        title="Contact Us"
        description="Send our team a general message. For a specific product, lot or equipment request, use the enquiry option on its listing."
      />
      
      <section className="section">
        
        <div className="shell">
          <div className="grid gap-6 lg:grid-cols-[360px_1fr] lg:items-start">
            <div className="flex flex-col gap-3">
              {CONTACT_EMAIL ? (
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="card card-interactive flex items-center gap-3 p-4"
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
                <a href={`tel:${CONTACT_PHONE}`} className="card card-interactive flex items-center gap-3 p-4">
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
                  className="card card-interactive flex items-center gap-3 p-4"
                >
                  <span aria-hidden="true" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.74.46 3.44 1.32 4.94L2 22l5.36-1.4a9.9 9.9 0 0 0 4.68 1.2h.01c5.43 0 9.84-4.4 9.84-9.84C21.89 6.4 17.47 2 12.04 2Zm5.75 13.9c-.24.68-1.42 1.3-1.96 1.34-.5.05-1.12.08-1.8-.1-.42-.13-.96-.31-1.66-.61-2.92-1.26-4.83-4.2-4.98-4.4-.14-.2-1.19-1.58-1.19-3.02 0-1.43.75-2.13 1.02-2.43.27-.29.58-.36.78-.36l.56.01c.18.01.42-.07.66.5.24.58.82 2 .89 2.14.07.14.12.31.02.5-.09.2-.14.32-.28.5-.14.17-.3.38-.43.51-.14.14-.29.29-.13.57.17.29.74 1.22 1.58 1.97 1.09.97 2 1.28 2.29 1.42.28.14.45.12.62-.07.17-.2.72-.84.91-1.12.19-.29.38-.24.64-.14.26.09 1.66.78 1.94.92.29.14.48.21.55.33.07.12.07.7-.17 1.38Z" />
                    </svg>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold uppercase tracking-wide text-steel-500">WhatsApp</span>
                    <span className="mt-0.5 block text-sm font-semibold text-navy-900">Message the desk</span>
                  </span>
                </a>
              ) : null}
              {!hasAnyChannel ? (
                <p className="text-sm text-steel-600">Use the contact form to reach our team.</p>
              ) : null}

              <div className="card flex items-start gap-3 p-4">
                <IconTile>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </IconTile>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-steel-500">Response time</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-navy-800">
                    We reply within one working day. For an urgent request, WhatsApp is fastest.
                  </span>
                </span>
              </div>
            </div>

            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
