import { OrdersView } from "@/components/account/AccountViews";
import { AccountSectionHeader } from "@/components/account/AccountSectionHeader";
import { getAccountResource } from "@/lib/auth-server";
import type { CustomerOrder } from "@/lib/account";

export default async function OrdersPage() {
  const data = await getAccountResource<{ ok: true; orders: CustomerOrder[] }>("orders");
  return (
    <div>
      <AccountSectionHeader eyebrow="Order history" title="Orders" description="Review orders placed using your customer account." />
      {data ? <OrdersView orders={data.orders} /> : <p role="alert" className="card p-5 text-sm text-signal-700">Orders could not be loaded. Refresh to retry, sign in again if your session expired, or contact support. Do not place a duplicate order while checking its status.</p>}
    </div>
  );
}
