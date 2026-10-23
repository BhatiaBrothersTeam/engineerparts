import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/auth-server";
import { AccountNavigation } from "@/components/account/AccountNavigation";
import { PageHero } from "@/components/ui/PageHero";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login?redirect=/account");

  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "Account" }]}
        eyebrow="Customer account"
        title={`Welcome, ${customer.firstName || customer.displayName}`}
        description={customer.company || customer.email}
      />

      <section className="section-alt section">
        <div className="shell">
          <div className="grid min-w-0 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside>
              <AccountNavigation />
            </aside>
            <div className="min-w-0">{children}</div>
          </div>
        </div>
      </section>
    </>
  );
}
