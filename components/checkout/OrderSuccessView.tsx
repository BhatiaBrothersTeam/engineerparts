"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCart } from "@/components/providers/CartProvider";
import { IconTile } from "@/components/ui/IconTile";
import { track } from "@/lib/analytics";
import { CONTACT_EMAIL, CONTACT_PHONE, formatPrice } from "@/lib/utils";

export interface OrderSummary {
  number: string;
  status: string;
  total: string;
  currency: string;
  paymentUrl: string;
  paymentMethod?: string;
  items: Array<{ name: string; quantity: number; total: string }>;
}

const CONFIRMED_STATUSES = new Set(["processing", "completed"]);
const FAILED_STATUSES = new Set(["failed", "cancelled"]);
const CHECKOUT_REFERENCE_STORAGE_KEY = "engineerparts.checkout.reference";
const POLL_SCHEDULE_MS = [3000, 5000, 8000, 13000, 20000, 20000, 20000];

type ViewState = "confirmed" | "confirming" | "timed-out" | "failed";

function deriveState(status: string, paymentMethod?: string): ViewState {
  if (CONFIRMED_STATUSES.has(status)) return "confirmed";
  if (FAILED_STATUSES.has(status)) return "failed";
  if (paymentMethod === "cod" && status === "on-hold") return "confirmed";
  return "confirming";
}

export function OrderSuccessView({
  initialOrder,
  orderId,
  orderKey,
}: {
  initialOrder: OrderSummary;
  orderId: number;
  orderKey: string;
}) {
  const { authenticated } = useAuth();
  const { clear, ready: cartReady } = useCart();
  const [order, setOrder] = useState(initialOrder);
  const [view, setView] = useState<ViewState>(deriveState(initialOrder.status, initialOrder.paymentMethod));
  const tracked = useRef(false);
  const cartCleared = useRef(false);

  useEffect(() => {
    if (view === "confirmed" && !tracked.current) {
      tracked.current = true;
      track("purchase", { order_id: orderId, value: Number(order.total), currency: order.currency });
    }
  }, [view, orderId, order.total, order.currency]);

  useEffect(() => {
    if (view === "confirmed" && cartReady && !cartCleared.current) {
      cartCleared.current = true;
      clear();
    }
  }, [view, cartReady, clear]);

  useEffect(() => {
    if (view !== "confirmed" && view !== "failed") return;
    try {
      sessionStorage.removeItem(CHECKOUT_REFERENCE_STORAGE_KEY);
    } catch {
      // Storage may be disabled; the completed order remains safe in WooCommerce.
    }
  }, [view]);

  useEffect(() => {
    if (view !== "confirming") return;

    let cancelled = false;
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController | null = null;

    async function poll() {
      controller = new AbortController();
      try {
        const response = await fetch(`/api/orders/${orderId}?order_key=${encodeURIComponent(orderKey)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await response.json().catch(() => null)) as { ok?: boolean; order?: OrderSummary } | null;
        if (cancelled) return;
        if (response.ok && data?.ok && data.order) {
          const nextState = deriveState(data.order.status, data.order.paymentMethod);
          setOrder(data.order);
          if (nextState !== "confirming") {
            setView(nextState);
            return;
          }
        }
      } catch {
        // transient failure — keep polling on schedule
      }
      if (cancelled) return;
      if (attempt >= POLL_SCHEDULE_MS.length) {
        setView("timed-out");
        return;
      }
      const delay = POLL_SCHEDULE_MS[attempt];
      attempt += 1;
      timer = setTimeout(poll, delay);
    }

    timer = setTimeout(poll, POLL_SCHEDULE_MS[0]);
    attempt = 1;

    function onVisible() {
      if (document.visibilityState === "visible" && !cancelled) {
        clearTimeout(timer);
        void poll();
      }
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [view, orderId, orderKey]);

  if (view === "confirmed") {
    return (
      <div className="card p-6 sm:p-10">
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
          <span className="icon-tile h-14 w-14 bg-emerald-50 text-emerald-600" aria-hidden="true">
            <CheckCircleIcon />
          </span>
          <p className="mt-4 text-xl font-extrabold text-navy-900">{order.paymentMethod === "cod" ? "Thank you — your Cash on Delivery order is confirmed" : "Thank you — your payment was successful"}</p>
          <p className="mt-2 text-sm text-steel-600">Order <span className="font-semibold text-navy-800">#{order.number}</span> is confirmed. {order.paymentMethod === "cod" ? "No online payment was taken. Please pay in cash when your order arrives." : "We've emailed you a receipt."}</p>
        </div>
        <OrderItems order={order} />
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
          {authenticated ? (
            <Link href="/account/orders" className="btn-primary">View my orders</Link>
          ) : (
            <Link href="/clearance" className="btn-primary">Continue shopping</Link>
          )}
          <Link href="/clearance" className="btn-outline">Back to clearance stock</Link>
        </div>
        <SupportFooter />
      </div>
    );
  }

  if (view === "failed") {
    const cancelled = order.status === "cancelled";
    return (
      <div className="card p-6 sm:p-10">
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
          <IconTile>
            <AlertIcon />
          </IconTile>
          <p className="mt-4 text-xl font-extrabold text-navy-900">{cancelled ? "Payment attempt expired or was cancelled" : "Payment did not go through"}</p>
          <p className="mt-2 text-sm text-steel-600">
            {cancelled
              ? `Order #${order.number} was cancelled and its reserved stock was released; review your cart and try again.`
              : `Order #${order.number} was not paid. Your cart has been kept so you can try again, or contact our sales team.`}
          </p>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3 sm:justify-start">
          <Link href="/checkout" className="btn-primary">Try again</Link>
        </div>
        <SupportFooter />
      </div>
    );
  }

  if (view === "timed-out") {
    return (
      <div className="card p-6 sm:p-10">
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
          <IconTile>
            <ClockIcon />
          </IconTile>
          <p className="mt-4 text-xl font-extrabold text-navy-900">Still confirming your payment</p>
          <p className="mt-2 text-sm text-steel-600">
            We could not confirm the payment status for order #{order.number} yet. Check your connection and refresh this page, or contact support with your order number. Do not pay again or place another order until its status is confirmed.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3 sm:justify-start">
          <Link href="/checkout" className="btn-outline">Return to cart</Link>
        </div>
        <SupportFooter />
      </div>
    );
  }

  return (
    <div className="card flex flex-col items-center p-6 text-center sm:items-start sm:p-10 sm:text-left" role="status" aria-live="polite">
      <IconTile>
        <span className="block h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" aria-hidden="true" />
      </IconTile>
      <p className="mt-4 text-xl font-extrabold text-navy-900">Confirming your payment...</p>
      <p className="mt-2 text-sm text-steel-600">Order #{order.number} — this usually takes just a few seconds.</p>
    </div>
  );
}

function OrderItems({ order }: { order: OrderSummary }) {
  return (
    <ul className="mt-6 divide-y divide-navy-100 rounded-md border border-navy-100 bg-navy-50/40 px-4 text-sm">
      {order.items.map((item, index) => (
        <li key={index} className="flex justify-between gap-3 py-3">
          <span className="min-w-0 truncate font-semibold text-navy-900">{item.name} × {item.quantity}</span>
          <span className="shrink-0 font-semibold text-navy-900">{formatPrice(Number(item.total), order.currency)}</span>
        </li>
      ))}
      <li className="flex justify-between gap-3 py-3 text-base">
        <span className="font-bold">Total</span>
        <span className="font-extrabold">{formatPrice(Number(order.total), order.currency)}</span>
      </li>
    </ul>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M12 3 2 20h20L12 3z" strokeLinejoin="round" />
      <path d="M12 10v4" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SupportFooter() {
  return (
    <section className="mt-6 border-t border-navy-100 pt-4 text-xs text-steel-600">
      <p className="font-semibold text-navy-800">Need help with your order?</p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {CONTACT_EMAIL ? <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> : null}
        {CONTACT_PHONE ? <a className="underline" href={`tel:${CONTACT_PHONE}`}>{CONTACT_PHONE}</a> : null}
        <Link className="underline" href="/contact">Contact support</Link>
      </div>
    </section>
  );
}
