"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";

const ICON_PROPS = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8 } as const;

const ITEMS = [
  [
    "Dashboard",
    "/account",
    <svg key="dashboard" className="h-5 w-5" {...ICON_PROPS}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
    </svg>,
  ],
  [
    "Orders",
    "/account/orders",
    <svg key="orders" className="h-5 w-5" {...ICON_PROPS}>
      <path d="M6 3.5h9l3.5 3.5V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
      <path d="M8.5 11h7M8.5 14.5h7M8.5 7.5h4" strokeLinecap="round" />
    </svg>,
  ],
  [
    "Enquiries / RFQs",
    "/account/enquiries",
    <svg key="enquiries" className="h-5 w-5" {...ICON_PROPS}>
      <path d="M3.5 13.5V7.5A2 2 0 0 1 5.5 5.5h13a2 2 0 0 1 2 2v6m-17 0V18a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-4.5m-17 0h4l1 2h6l1-2h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>,
  ],
  [
    "Saved Products",
    "/account/saved-products",
    <svg key="saved" className="h-5 w-5" {...ICON_PROPS}>
      <path d="M12 20s-7.5-4.6-9.7-9A5.1 5.1 0 0 1 12 6.3 5.1 5.1 0 0 1 21.7 11c-2.2 4.4-9.7 9-9.7 9Z" strokeLinejoin="round" />
    </svg>,
  ],
  [
    "Addresses",
    "/account/addresses",
    <svg key="addresses" className="h-5 w-5" {...ICON_PROPS}>
      <path d="M12 21s-6.5-5.1-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.9 12 21 12 21Z" strokeLinejoin="round" />
      <circle cx="12" cy="10.5" r="2.25" />
    </svg>,
  ],
  [
    "Profile",
    "/account/profile",
    <svg key="profile" className="h-5 w-5" {...ICON_PROPS}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.4-3.5 4.3-5.5 7.5-5.5s6.1 2 7.5 5.5" strokeLinecap="round" />
    </svg>,
  ],
  [
    "Account Security",
    "/account/security",
    <svg key="security" className="h-5 w-5" {...ICON_PROPS}>
      <path d="M12 3.5 5 6v5.5c0 4.3 2.9 7.8 7 9 4.1-1.2 7-4.7 7-9V6l-7-2.5Z" strokeLinejoin="round" />
      <path d="M9.5 12.2 11.3 14l3.2-3.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>,
  ],
] as const;

export function AccountNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const current = ITEMS.find(([, href]) => pathname === href || (href !== "/account" && pathname.startsWith(`${href}/`)))?.[1] ?? "/account";

  return (
    <>
      <label className="block lg:hidden">
        <span className="field-label">Account section</span>
        <select className="field" value={current} onChange={(event) => router.push(event.target.value)}>
          {ITEMS.map(([label, href]) => (
            <option key={href} value={href}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <nav aria-label="Account navigation" className="hidden rounded-card border border-navy-100 bg-white p-2 shadow-card lg:block">
        <ul className="space-y-1">
          {ITEMS.map(([label, href, icon]) => {
            const active = pathname === href || (href !== "/account" && pathname.startsWith(`${href}/`));
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-semibold transition-colors",
                    active ? "bg-navy-900 text-white" : "text-navy-800 hover:bg-navy-50",
                  )}
                >
                  <span className={cn("shrink-0", active ? "text-brand-300" : "text-brand-600")} aria-hidden="true">
                    {icon}
                  </span>
                  <span className="min-w-0 truncate">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-2 flex min-h-11 w-full items-center gap-3 border-t border-navy-100 px-3.5 py-3 text-left text-sm font-semibold text-signal-700 hover:bg-signal-50"
        >
          <svg className="h-5 w-5 shrink-0" {...ICON_PROPS} aria-hidden="true">
            <path d="M9 7.5V6a2 2 0 0 1 2-2h5.5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2v-1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 12H3.5m0 0 3-3m-3 3 3 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Sign out</span>
        </button>
      </nav>
    </>
  );
}
