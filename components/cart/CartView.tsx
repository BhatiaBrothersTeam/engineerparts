"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/providers/CartProvider";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { IconTile } from "@/components/ui/IconTile";
import { formatNumber, formatPrice, isPublicProductValue } from "@/lib/utils";

export function CartView() {
  const { items, subtotal, shipping, tax, total, shippingLabel, freeShippingRemaining, freeShippingLabel, quoteLoading, quoteError, stockValid, updateQuantity, removeItem, ready } = useCart();
  const currency = items[0]?.currency ?? "";

  if (!ready) {
    return (
      <div className="card flex items-center gap-3 p-6 text-sm text-steel-600">
        <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-navy-200 border-t-brand-600" aria-hidden="true" />
        Loading cart...
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="card mx-auto max-w-xl p-8 text-center sm:p-12">
        <IconTile>
          <EmptyCartIcon />
        </IconTile>
        <p className="mt-5 text-xl font-extrabold text-navy-900">Your cart is empty</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-steel-600">
          Add fixed-price clearance items from the stock pages. Enquiry-only and sold items cannot be
          purchased directly — submit an enquiry instead.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/clearance" className="btn-primary">
            Browse clearance stock
          </Link>
          <Link href="/enquiry" className="btn-outline">
            Submit an enquiry
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)]">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-steel-500">
          {formatNumber(items.length)} {items.length === 1 ? "item" : "items"} in your cart
        </p>
        {items.map((line) => (
          <article key={line.productId} aria-label={`${line.name}, SKU ${line.sku}`} className="card flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
            <Link href={`/product/${line.slug}`} className="relative h-28 w-full shrink-0 overflow-hidden rounded-md border border-navy-100 bg-navy-50 sm:h-28 sm:w-36">
              <Image src={line.image} alt={line.name} fill sizes="144px" className="object-contain p-2" />
            </Link>
            <div className="min-w-0 flex-1">
              {isPublicProductValue(line.brand, "brand") ? <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">{line.brand}</p> : null}
              <h2 className="mt-1 break-words text-sm font-bold text-navy-900">
                <Link href={`/product/${line.slug}`} className="hover:text-brand-700">
                  {line.name}
                </Link>
              </h2>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-steel-600 sm:grid-cols-3">
                <div className="min-w-0">
                  <dt>SKU</dt>
                  <dd className="truncate font-semibold text-navy-800" title={line.sku}>{line.sku}</dd>
                </div>
                {isPublicProductValue(line.condition) ? <div>
                  <dt>Condition</dt>
                  <dd className="break-words font-semibold text-navy-800">{line.condition}</dd>
                </div> : null}
                {isPublicProductValue(line.warehouse) ? <div className="col-span-2 sm:col-span-1">
                  <dt>Warehouse</dt>
                  <dd className="break-words font-semibold text-navy-800">{line.warehouse}</dd>
                </div> : null}
              </dl>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <QuantityStepper
                  value={line.quantity}
                  max={line.maxQuantity}
                  disabled={line.maxQuantity < 1}
                  onChange={(value) => updateQuantity(line.productId, value)}
                />
                {line.maxQuantity < 1 ? <p className="mt-2 text-xs font-semibold text-signal-700">Out of stock. Remove this item to continue.</p> : null}
                <p className="text-xs text-steel-500">{formatNumber(line.maxQuantity)} units available</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-row items-end justify-between gap-4 border-t border-navy-100 pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
              <div className="text-right">
                <p className="text-sm font-semibold text-steel-500">{formatPrice(line.unitPrice, line.currency)} each</p>
                <p className="mt-1 text-lg font-extrabold text-navy-900">
                  {formatPrice(line.unitPrice * line.quantity, line.currency)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeItem(line.productId)}
                aria-label={`Remove ${line.name} from cart`}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-steel-500 transition-colors hover:bg-signal-50 hover:text-signal-700"
              >
                <RemoveIcon />
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>

      <aside aria-label="Order summary" className="card h-fit p-5 lg:sticky lg:top-36">
        <h2 className="text-sm font-bold uppercase tracking-wide text-navy-900">Order summary</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-steel-600">Subtotal</dt>
            <dd className="font-semibold text-navy-900">{formatPrice(subtotal, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-steel-600">{shippingLabel}</dt>
            <dd className="font-semibold text-navy-900">{quoteLoading ? "Calculating..." : formatPrice(shipping, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-steel-600">VAT</dt>
            <dd className="font-semibold text-navy-900">{quoteLoading ? "Calculating..." : formatPrice(tax, currency)}</dd>
          </div>
          <div className="flex justify-between border-t border-navy-100 pt-3 text-base">
            <dt className="font-bold text-navy-900">Total</dt>
            <dd className="font-extrabold text-navy-900">{formatPrice(total, currency)}</dd>
          </div>
        </dl>
        {freeShippingRemaining && freeShippingRemaining > 0 ? (
          <p className="mt-3 rounded-md bg-navy-50 px-3 py-2 text-xs font-semibold text-navy-700">
            Add {formatPrice(freeShippingRemaining, currency)} more to unlock {freeShippingLabel ?? "free shipping"}.
          </p>
        ) : null}
        {quoteError ? <p className="mt-3 text-xs font-semibold text-signal-700">Shipping and tax totals are temporarily unavailable. Product subtotal is shown.</p> : null}
        <p className="mt-3 text-[11px] leading-relaxed text-steel-500">
          Product prices, shipping, VAT and totals reflect the selected quantities.
        </p>
        {!stockValid ? <p role="status" className="mt-4 text-xs font-semibold text-signal-700">{quoteLoading ? "Checking current stock..." : quoteError ? "Could not verify current stock. Please reload and try again." : "Update your cart to match current stock before checkout."}</p> : null}
        <Link href="/checkout" aria-disabled={!stockValid} className={`btn-primary mt-5 w-full ${stockValid ? "" : "pointer-events-none opacity-50"}`}>
          Proceed to checkout
        </Link>
        <Link href="/clearance" className="btn-outline mt-2 w-full">
          Continue browsing
        </Link>
      </aside>
    </div>
  );
}

function EmptyCartIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M3 5h2l2.2 10.3a2 2 0 0 0 2 1.7h7.6a2 2 0 0 0 2-1.6L20 8H6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.5" cy="20" r="1.3" />
      <circle cx="17.5" cy="20" r="1.3" />
      <path d="M9 11l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
