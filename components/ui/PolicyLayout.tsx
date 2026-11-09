import Link from "next/link";
import type { ReactNode } from "react";
import { CONTACT_EMAIL, WHATSAPP_NUMBER, cn, whatsappLink } from "@/lib/utils";

const POLICY_LINKS = [
  { label: "FAQ", href: "/faq" },
  { label: "Shipping & Delivery", href: "/shipping-delivery" },
  { label: "Returns & Refunds", href: "/returns-refunds" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy-policy" },
];

/**
 * Shared body layout for help and legal pages: a sticky policy menu and help card
 * beside the content, so text keeps a readable line length while the page still
 * uses the full screen width. On phones the menu becomes a scrollable link row.
 */
export function PolicyLayout({ current, children }: { current: string; children: ReactNode }) {
  return (
    <section className="section pt-6 sm:pt-8">
      <div className="shell grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[16.5rem_minmax(0,1fr)] xl:gap-12">
        <aside className="min-w-0 lg:sticky lg:top-40 lg:self-start">
          <nav aria-label="Help and policies" className="lg:card lg:p-2">
            <p className="eyebrow hidden px-3 pb-2 pt-2 text-steel-500 lg:block">Help &amp; policies</p>
            <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:flex-col lg:gap-0.5">
              {POLICY_LINKS.map((link) => {
                const active = link.href === current;
                return (
                  <li key={link.href} className="shrink-0">
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-10 items-center whitespace-nowrap rounded-md px-3 text-sm font-semibold transition-colors",
                        "border lg:border-0",
                        active
                          ? "border-brand-200 bg-brand-50 text-brand-700"
                          : "border-navy-200 text-navy-800 hover:bg-navy-50 hover:text-brand-700",
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="card mt-4 hidden p-5 lg:block">
            <p className="text-h4 text-navy-900">Need help?</p>
            <p className="mt-1.5 text-sm leading-relaxed text-steel-600">
              Our team replies within one working day.
            </p>
            <div className="mt-4 grid gap-2">
              <Link href="/contact" className="btn-primary btn-sm">
                Contact us
              </Link>
              {WHATSAPP_NUMBER ? (
                <a
                  href={whatsappLink("Hello Engineerparts.com, I have a question.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                >
                  WhatsApp
                </a>
              ) : null}
            </div>
            {CONTACT_EMAIL ? (
              <a href={`mailto:${CONTACT_EMAIL}`} className="mt-3 block break-all text-xs font-semibold text-steel-600 hover:text-brand-700">
                {CONTACT_EMAIL}
              </a>
            ) : null}
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}
