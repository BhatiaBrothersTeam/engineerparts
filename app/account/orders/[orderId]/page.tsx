import { notFound } from "next/navigation";
import Link from "next/link";
import { OrderDetailView } from "@/components/account/AccountViews";
import { getAccountResource } from "@/lib/auth-server";
import type { CustomerOrderDetail } from "@/lib/account";

export default async function OrderPage({ params }: { params: { orderId: string } }) {
  if (!/^\d+$/.test(params.orderId)) notFound();
  const data = await getAccountResource<{ ok: true; order: CustomerOrderDetail }>(`orders/${params.orderId}`);
  if (!data) return <p role="alert" className="card p-5 text-sm text-signal-700">This order could not be loaded. <Link href="/account/orders" className="underline">Open your order history</Link> and retry, or contact support with your order number. Do not pay again until its status is confirmed.</p>;
  return (
    <div>
      <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
        <span aria-hidden="true">&larr;</span> Back to orders
      </Link>
      <div className="mt-5">
        <OrderDetailView order={data.order} />
      </div>
    </div>
  );
}
