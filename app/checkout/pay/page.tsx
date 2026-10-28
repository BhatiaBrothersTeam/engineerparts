import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { wordpressAccountRequest } from "@/lib/auth-server";
import { logError } from "@/lib/logger";
import { getWooCommerceOrderIfKeyMatches, isValidWooCommerceOrderKey } from "@/lib/woocommerce";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Pay for your order",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function OrderPaymentPage({
  searchParams,
}: {
  searchParams: { order_id?: string; order_key?: string; error?: string };
}) {
  const orderId = Number(searchParams.order_id);
  const orderKey = searchParams.order_key ?? "";
  const valid = Number.isSafeInteger(orderId) && orderId > 0 && isValidWooCommerceOrderKey(orderKey);
  const order = valid ? await getWooCommerceOrderIfKeyMatches(orderId, orderKey) : null;
  const reference = `order_id=${orderId}&order_key=${encodeURIComponent(orderKey)}`;
  const payable = order?.payment_method === "nomod" && order.status === "pending";

  async function pay() {
    "use server";
    if (!valid) redirect("/contact");
    const current = await getWooCommerceOrderIfKeyMatches(orderId, orderKey);
    if (!current || current.payment_method !== "nomod" || current.status !== "pending") {
      redirect(`/checkout/success?${reference}`);
    }
    const response = await wordpressAccountRequest<{ ok: boolean; paymentUrl?: string }>(
      `orders/${orderId}/payment-link`, { method: "POST", body: {} },
    );
    let destination: URL | null = null;
    try {
      if (response.status === 200 && response.data.ok && response.data.paymentUrl) {
        const url = new URL(response.data.paymentUrl);
        const backendHosts = [process.env.WORDPRESS_URL, process.env.WOOCOMMERCE_URL]
          .filter((value): value is string => Boolean(value))
          .map((value) => new URL(value).hostname);
        if (url.protocol === "https:" && !url.username && !url.password &&
            url.hostname !== "shop.engineerparts.com" && !backendHosts.includes(url.hostname)) destination = url;
      }
    } catch (error) {
      logError("order_email_payment_url_invalid", { orderId, error });
    }
    if (!destination) {
      logError("order_email_payment_unavailable", { orderId, status: response.status });
      redirect(`/checkout/pay?${reference}&error=unavailable`);
    }
    redirect(destination.href);
  }

  return (
    <section className="section">
      <div className="shell max-w-xl">
        <div className="card p-6 sm:p-10">
          <h1 className="text-h1 text-navy-900">{order ? `Order #${order.number}` : "Order not found"}</h1>
          {!order ? (
            <p className="mt-4 text-sm text-steel-600">This order link is invalid. Use the latest email or contact support with your order number.</p>
          ) : payable ? (
            <>
              <p className="mt-4 text-sm text-steel-600">Continue to Nomod to pay securely for this existing order. No new order will be placed.</p>
              {searchParams.error ? <p role="alert" className="mt-4 text-sm text-red-700">We could not start payment. Check your order status or contact support before retrying. Do not pay again if you have already been charged.</p> : null}
              <form action={pay} className="mt-6"><button className="btn-primary" type="submit">Continue to secure payment</button></form>
            </>
          ) : (
            <>
              <p className="mt-4 text-sm text-steel-600">{order.payment_method === "cod" ? "This is a Cash on Delivery order. No online payment is required." : "This order is not awaiting online payment. Check its current status before taking any action."}</p>
              <Link className="btn-primary mt-6 inline-flex" href={`/checkout/success?${reference}`}>View order status</Link>
            </>
          )}
          <Link className="mt-6 block text-sm font-bold text-brand-700" href="/contact">Contact support</Link>
        </div>
      </div>
    </section>
  );
}
