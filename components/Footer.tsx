"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ClearanceAlerts } from "@/components/home/ClearanceAlerts";
import { track } from "@/lib/analytics";
import type { CategorySummaryItem } from "@/lib/categories";
import { CONTACT_EMAIL, CONTACT_PHONE, WHATSAPP_NUMBER, whatsappLink } from "@/lib/utils";
import { OPEN_COOKIE_SETTINGS_EVENT } from "@/lib/cookie-consent";

const MAX_FOOTER_CATEGORIES = 6;

export function Footer({ categories = [] }: { categories?: CategorySummaryItem[] }) {
  function onWhatsApp() {
    track("whatsapp_click", { source: "Footer" });
  }

  const footerCategories = categories.slice(0, MAX_FOOTER_CATEGORIES);

  return (
    <footer className="border-t border-navy-100 bg-navy-50 text-steel-600">
      <div className="shell pb-24 pt-10 sm:py-12">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-5 text-sm leading-6 text-steel-600">
            Industrial equipment, spare parts, tools and clearance stock for business buyers.
          </p>
          <p className="mt-3 text-xs font-bold uppercase leading-5 tracking-wide text-brand-600">
            Surplus stock, dead stock &amp; engineered parts
          </p>
          <Link href="/enquiry" className="btn-primary btn-sm mt-4">
            Request a Quote
          </Link>
        </div>

        <div className={`mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-x-10 ${footerCategories.length ? "lg:grid-cols-[repeat(4,minmax(0,1fr))_minmax(240px,1.35fr)]" : "lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(240px,1.35fr)]"}`}>
          <FooterColumn
            title="Clearance Stock"
            links={[
              { label: "All Clearance Stock", href: "/clearance" },
              { label: "Retail", href: "/clearance/retail" },
              { label: "Wholesale", href: "/clearance/wholesale" },
              { label: "New Arrivals", href: "/recently-added" },
              { label: "Brands", href: "/brands" },
            ]}
          />

          {footerCategories.length ? (
            <FooterColumn
              title="Categories"
              links={footerCategories.map((category) => ({
                label: category.label,
                href: `/clearance/${category.slug}`,
              }))}
            />
          ) : null}

          <FooterColumn
            title="Company"
            links={[
              { label: "About", href: "/about" },
              { label: "Request a Quote", href: "/enquiry" },
              { label: "FAQ", href: "/faq" },
            ]}
          />

          <FooterColumn
            title="Legal"
            links={[
              { label: "Privacy Policy", href: "/privacy-policy" },
              { label: "Terms & Conditions", href: "/terms" },
              { label: "Returns & Refunds Policy", href: "/returns-refunds" },
              { label: "Shipping & Delivery Policy", href: "/shipping-delivery" },
            ]}
          />
          <div className="col-span-2 max-w-sm lg:col-span-1">
            <ClearanceAlerts />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-5 border-t border-navy-200 pt-5 text-[11px] leading-relaxed sm:mt-14 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {CONTACT_EMAIL ? <a className="break-all hover:text-brand-700 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> : null}
            {CONTACT_PHONE ? <a className="hover:text-brand-700 hover:underline" href={`tel:${CONTACT_PHONE}`}>{CONTACT_PHONE}</a> : null}
            {WHATSAPP_NUMBER ? (
              <a href={whatsappLink("")} target="_blank" rel="noopener noreferrer" onClick={onWhatsApp} className="hover:text-brand-700 hover:underline">
                WhatsApp
              </a>
            ) : null}
            <button
              type="button"
              className="hover:text-brand-700 hover:underline"
              onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))}
            >
              Cookie settings
            </button>
          </div>
          <div className="space-y-1 lg:text-right">
            <p>&copy; {new Date().getFullYear()} Engineerparts.com. All rights reserved.</p>
            <p className="text-steel-400">Surplus stock, dead stock and engineered parts.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h2 className="eyebrow text-navy-900">{title}</h2>
      <ul className="mt-3 space-y-2 text-xs leading-relaxed">
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
