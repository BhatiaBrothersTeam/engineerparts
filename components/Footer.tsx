"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { track } from "@/lib/analytics";
import type { CategorySummaryItem } from "@/lib/categories";
import { CONTACT_EMAIL, CONTACT_PHONE, WHATSAPP_NUMBER, whatsappLink } from "@/lib/utils";

const MAX_FOOTER_CATEGORIES = 6;

export function Footer({ categories = [] }: { categories?: CategorySummaryItem[] }) {
  function onWhatsApp() {
    track("whatsapp_click", { source: "Footer" });
  }

  const footerCategories = categories.slice(0, MAX_FOOTER_CATEGORIES);

  return (
    <footer className="border-t border-navy-800 bg-navy-950 text-steel-300">
      <div className="shell py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_repeat(4,1fr)]">
          <div>
            <Logo light />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-steel-400">
              Industrial equipment, spare parts, tools and clearance stock for business buyers.
            </p>
            <p className="mt-3 max-w-xs text-xs font-semibold uppercase tracking-wide text-brand-300">
              Surplus stock, dead stock &amp; engineered parts
            </p>
            <div className="mt-5">
              <Link href="/enquiry" className="btn-primary btn-sm">
                Request a Quote
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {CONTACT_EMAIL ? <a className="chip-dark" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> : null}
              {CONTACT_PHONE ? <a className="chip-dark" href={`tel:${CONTACT_PHONE}`}>{CONTACT_PHONE}</a> : null}
              {WHATSAPP_NUMBER ? <a
                href={whatsappLink("")}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onWhatsApp}
                className="chip-dark"
              >
                WhatsApp
              </a> : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:gap-10 lg:contents">
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
              <div>
                <h2 className="eyebrow text-white">Categories</h2>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {footerCategories.map((category) => (
                    <li key={category.slug}>
                      <Link
                        href={`/clearance/${category.slug}`}
                        className="flex items-center gap-2 transition-colors hover:text-white"
                      >
                        <CategoryIcon category={category.slug} className="h-3.5 w-3.5 shrink-0 text-steel-500" />
                        <span className="truncate">{category.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
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
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-navy-800 pt-7 text-xs text-steel-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} Engineerparts.com. All rights reserved.
          </p>
          <p>Dealing in surplus stock, dead stock and engineered parts.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h2 className="eyebrow text-white">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link href={link.href} className="transition-colors hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
