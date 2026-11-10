"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Reveal } from "@/components/ui/Reveal";
import { track } from "@/lib/analytics";
import type { CategorySummaryItem } from "@/lib/categories";
import { OPEN_COOKIE_SETTINGS_EVENT } from "@/lib/cookie-consent";
import { CONTACT_EMAIL, CONTACT_PHONE, WHATSAPP_NUMBER, whatsappLink } from "@/lib/utils";

const MAX_FOOTER_CATEGORIES = 6;

export function Footer({ categories = [] }: { categories?: CategorySummaryItem[] }) {
  const footerCategories = categories.slice(0, MAX_FOOTER_CATEGORIES);
  const whatsAppHref = whatsappLink(
    "Hello Engineerparts.com, I would like to enquire about your industrial products and clearance stock.",
  );

  function onWhatsApp() {
    track("whatsapp_click", { source: "Footer" });
  }

  return (
    <footer className="border-t border-navy-100 bg-navy-50 text-steel-600">
      <Reveal className="shell pb-24 pt-12 sm:py-14 lg:py-16">
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-6">
          <div className="sm:col-span-2 lg:pr-8">
            <Logo large />
            <p className="mt-5 max-w-md text-sm leading-6 text-steel-600">
              Backed by over 70 years of industry experience, Engineer Parts helps maintenance and
              procurement teams identify and source industrial spare parts for repairs, replacements
              and planned maintenance.
            </p>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-brand-600">
              Practical sourcing support from enquiry to delivery.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={whatsAppHref}
                target={WHATSAPP_NUMBER ? "_blank" : undefined}
                rel={WHATSAPP_NUMBER ? "noopener noreferrer" : undefined}
                onClick={onWhatsApp}
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-brand-400 px-4 py-2 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-100"
              >
                WhatsApp
              </a>
              <Link
                href="/enquiry"
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-brand-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-500"
              >
                Enquire Now
              </Link>
            </div>
          </div>

          <FooterColumn
            title="Clearance Stock"
            links={[
              { label: "All Clearance Stock", href: "/clearance" },
              { label: "Recently Added", href: "/recently-added" },
              { label: "Clearance Lots", href: "/lots" },
              { label: "Equipment", href: "/equipment" },
              { label: "Brands", href: "/brands" },
            ]}
          />

          <FooterColumn
            title="Product Categories"
            links={
              footerCategories.length
                ? footerCategories.map((category) => ({
                    label: category.label,
                    href: `/clearance/${category.slug}`,
                  }))
                : [{ label: "Browse All Categories", href: "/categories" }]
            }
          />

          <FooterColumn
            title="Company"
            links={[
              { label: "About Engineer Parts", href: "/about" },
              { label: "Contact Us", href: "/contact" },
              { label: "My Enquiries", href: "/my-enquiries" },
              { label: "FAQ", href: "/faq" },
              { label: "Shipping & Delivery", href: "/shipping-delivery" },
              { label: "Returns & Refunds", href: "/returns-refunds" },
            ]}
          />

          <div>
            <h2 className="eyebrow text-navy-900">Contact &amp; Location</h2>
            <address className="mt-4 space-y-3 text-sm not-italic leading-6 text-steel-600">
              <p>
                United Arab Emirates
                <br />
                UAE-wide delivery
                <br />
                Collection by appointment
              </p>
              {CONTACT_EMAIL ? (
                <a className="block break-all hover:text-brand-700 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
              ) : null}
              {CONTACT_PHONE ? (
                <a className="block hover:text-brand-700 hover:underline" href={`tel:${CONTACT_PHONE}`}>
                  {CONTACT_PHONE}
                </a>
              ) : null}
            </address>
          </div>
        </div>

        <div className="mt-12 rounded-lg border border-navy-200 bg-white p-5 sm:p-6">
          <h2 className="text-sm font-bold text-navy-900">Industrial spare-parts sourcing support</h2>
          <p className="mt-2 max-w-5xl text-xs leading-5 text-steel-600 sm:text-sm sm:leading-6">
            Send us a part number, equipment make and model, technical specifications, a label photo
            or a complete parts list. We&apos;ll help narrow down the options, check availability and
            provide an estimated delivery timeline.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-5 border-t border-navy-200 pt-6 text-xs leading-relaxed text-steel-500 lg:flex-row lg:items-center lg:justify-between">
          <p>&copy; {new Date().getFullYear()} Engineerparts.com. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-3">
            <Link href="/privacy-policy" className="hover:text-brand-700 hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-brand-700 hover:underline">
              Terms &amp; Conditions
            </Link>
            <Link href="/contact" className="hover:text-brand-700 hover:underline">
              Contact
            </Link>
            <button
              type="button"
              className="hover:text-brand-700 hover:underline"
              onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))}
            >
              Cookie settings
            </button>
          </div>
        </div>
      </Reveal>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h2 className="eyebrow text-navy-900">{title}</h2>
      <ul className="mt-4 space-y-3 text-sm leading-5">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link href={link.href} className="transition-colors hover:text-brand-700 hover:underline">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
