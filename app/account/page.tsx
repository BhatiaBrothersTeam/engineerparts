import type { Metadata } from "next";
import Link from "next/link";
import { IconTile } from "@/components/ui/IconTile";
import { getAccountResource } from "@/lib/auth-server";
import type { CustomerEnquiry, CustomerOrder } from "@/lib/account";

export const metadata: Metadata = {
  title: "Account",
  description: "Engineerparts.com customer account for clearance orders and enquiries.",
};

const ICON_PROPS = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8 } as const;

export default async function AccountPage() {
  const [orderData, enquiryData] = await Promise.all([
    getAccountResource<{ ok: true; orders: CustomerOrder[] }>("orders"),
    getAccountResource<{ ok: true; enquiries: CustomerEnquiry[] }>("enquiries"),
  ]);
  const orders = orderData?.orders ?? [];
  const enquiries = enquiryData?.enquiries ?? [];

  const TILES = [
    {
      title: "Orders",
      copy: orders.length ? `${orders.length} ${orders.length === 1 ? "order" : "orders"} on your account.` : "You have not placed any orders yet.",
      href: "/account/orders",
      icon: (
        <svg className="h-5 w-5" {...ICON_PROPS}>
          <path d="M6 3.5h9l3.5 3.5V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
          <path d="M8.5 11h7M8.5 14.5h7M8.5 7.5h4" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      title: "Enquiries / RFQs",
      copy: enquiries.length ? `${enquiries.length} submitted ${enquiries.length === 1 ? "enquiry" : "enquiries"}.` : "You have not submitted any enquiries yet.",
      href: "/account/enquiries",
      icon: (
        <svg className="h-5 w-5" {...ICON_PROPS}>
          <path d="M3.5 13.5V7.5A2 2 0 0 1 5.5 5.5h13a2 2 0 0 1 2 2v6m-17 0V18a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-4.5m-17 0h4l1 2h6l1-2h4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      title: "Saved Products",
      copy: "Products you have bookmarked for later.",
      href: "/account/saved-products",
      icon: (
        <svg className="h-5 w-5" {...ICON_PROPS}>
          <path d="M12 20s-7.5-4.6-9.7-9A5.1 5.1 0 0 1 12 6.3 5.1 5.1 0 0 1 21.7 11c-2.2 4.4-9.7 9-9.7 9Z" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      title: "Addresses",
      copy: "Manage the billing and delivery addresses on your account.",
      href: "/account/addresses",
      icon: (
        <svg className="h-5 w-5" {...ICON_PROPS}>
          <path d="M12 21s-6.5-5.1-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.9 12 21 12 21Z" strokeLinejoin="round" />
          <circle cx="12" cy="10.5" r="2.25" />
        </svg>
      ),
    },
    {
      title: "Profile",
      copy: "Update your contact and B2B company details.",
      href: "/account/profile",
      icon: (
        <svg className="h-5 w-5" {...ICON_PROPS}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M4.5 20c1.4-3.5 4.3-5.5 7.5-5.5s6.1 2 7.5 5.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      title: "Account Security",
      copy: "Change your password and review active sessions.",
      href: "/account/security",
      icon: (
        <svg className="h-5 w-5" {...ICON_PROPS}>
          <path d="M12 3.5 5 6v5.5c0 4.3 2.9 7.8 7 9 4.1-1.2 7-4.7 7-9V6l-7-2.5Z" strokeLinejoin="round" />
          <path d="M9.5 12.2 11.3 14l3.2-3.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      title: "Cart",
      copy: "Continue shopping where you left off.",
      href: "/cart",
      icon: (
        <svg className="h-5 w-5" {...ICON_PROPS}>
          <circle cx="9.5" cy="20" r="1.3" />
          <circle cx="17.5" cy="20" r="1.3" />
          <path d="M3 4h2.2l1.9 11.2a1.5 1.5 0 0 0 1.5 1.3h8.6a1.5 1.5 0 0 0 1.5-1.2L20.5 8H6.1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 sm:mb-7">
        <p className="eyebrow text-brand-700">Overview</p>
        <h2 className="text-h2 mt-2 text-navy-950">Account dashboard</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-steel-600">
          Jump into orders, enquiries, saved products and your account details.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {TILES.map((tile) => (
          <Link key={tile.title} href={tile.href} className="card card-interactive flex items-start gap-4 p-5">
            <IconTile>{tile.icon}</IconTile>
            <div className="min-w-0">
              <h3 className="text-h4 text-navy-900">{tile.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-steel-600">{tile.copy}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-7 grid gap-5 xl:grid-cols-2">
        <section className="card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-h4 text-navy-950">Recent orders</h3>
            {orders.length ? (
              <Link href="/account/orders" className="link-underline text-xs font-semibold text-brand-700">
                View all
              </Link>
            ) : null}
          </div>
          {orders.length ? (
            <ul className="mt-2 divide-y divide-navy-100">
              {orders.slice(0, 3).map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="flex min-w-0 items-center justify-between gap-3 py-3 text-sm font-semibold text-navy-900 hover:text-brand-700"
                  >
                    <span className="min-w-0 break-words">Order #{order.number}</span>
                    <span className="shrink-0 rounded-full bg-navy-100 px-2.5 py-1 text-[11px] font-bold uppercase text-navy-800">{order.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-steel-600">You have not placed any orders yet.</p>
          )}
        </section>

        <section className="card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-h4 text-navy-950">Recent enquiries</h3>
            {enquiries.length ? (
              <Link href="/account/enquiries" className="link-underline text-xs font-semibold text-brand-700">
                View all
              </Link>
            ) : null}
          </div>
          {enquiries.length ? (
            <ul className="mt-2 divide-y divide-navy-100">
              {enquiries.slice(0, 3).map((item) => (
                <li key={item.reference}>
                  <Link
                    href="/account/enquiries"
                    className="flex min-w-0 items-center justify-between gap-3 py-3 text-sm font-semibold text-navy-900 hover:text-brand-700"
                  >
                    <span className="min-w-0 break-words">{item.reference}</span>
                    <span className="shrink-0 rounded-full bg-navy-100 px-2.5 py-1 text-[11px] font-bold uppercase capitalize text-navy-800">{item.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-steel-600">You have not submitted any enquiries yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
