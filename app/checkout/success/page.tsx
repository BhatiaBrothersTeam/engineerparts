import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { IconTile } from "@/components/ui/IconTile";
import { OrderSuccessView } from "@/components/checkout/OrderSuccessView";
import { getWooCommerceOrderIfKeyMatches, isValidWooCommerceOrderKey } from "@/lib/woocommerce";

export const metadata: Metadata = {
  title: "Order confirmation",
  description: "Your Engineerparts.com order confirmation.",
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { order_id?: string; order_key?: string };
}) {
  const orderId = Number(searchParams.order_id);
  const orderKey = searchParams.order_key ?? "";
  const valid = Number.isSafeInteger(orderId) && orderId > 0 && isValidWooCommerceOrderKey(orderKey);

  const order = valid ? await getWooCommerceOrderIfKeyMatches(orderId, orderKey) : null;

  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "Cart", href: "/cart" }, { label: "Checkout", href: "/checkout" }, { label: "Order confirmation" }]}
        eyebrow="Checkout"
        title={order ? "Order confirmation" : "Order not found"}
        tone="light"
      />
      <section className="section pt-8">
        <div className="shell max-w-2xl">
          {order ? (
            <OrderSuccessView initialOrder={mapOrder(order)} orderId={orderId} orderKey={orderKey} />
          ) : (
            <div className="card p-6 text-center sm:p-10">
              <IconTile>
                <QuestionIcon />
              </IconTile>
              <p className="mt-4 text-lg font-bold text-navy-900">We couldn&apos;t find this order</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-steel-600">
                This confirmation link looks invalid or has expired. If you just completed a payment, check your email for a receipt, or contact our sales team.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link href="/checkout" className="btn-primary">
                  Back to checkout
                </Link>
                <Link href="/contact" className="btn-outline">
                  Contact support
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function QuestionIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.9.4-1.5 1-1.5 2.1" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function mapOrder(order: NonNullable<Awaited<ReturnType<typeof getWooCommerceOrderIfKeyMatches>>>) {
  return {
    number: order.number,
    status: order.status,
    total: order.total,
    currency: order.currency,
    paymentUrl: order.payment_url,
    paymentMethod: order.payment_method,
    items: order.line_items.map((item) => ({ name: item.name, quantity: item.quantity, total: item.total })),
  };
}
