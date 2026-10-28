"use client";

import Image from "next/image";
import Link from "next/link";
import { ConditionPill, ListingBadges, StatusPill } from "@/components/ui/Badge";
import { useEnquiry } from "@/components/providers/EnquiryProvider";
import { track } from "@/lib/analytics";
import type { Product } from "@/lib/types";
import { absoluteUrl, formatNumber, openWhatsApp, productWhatsAppMessage, relativeAdded } from "@/lib/utils";

export function WholesaleProductCard({ product }: { product: Product }) {
  const { openEnquiry } = useEnquiry();

  function onWhatsApp() {
    track("whatsapp_click", { source: "WholesaleProductCard", sku: product.sku });
    openWhatsApp(
      productWhatsAppMessage({
        name: product.name,
        sku: product.sku,
        part_number: product.part_number,
        brand: product.brand,
        wholesale: true,
        url: absoluteUrl(`/product/${product.slug}`),
      }),
    );
  }

  function onEnquire() {
    openEnquiry({
      mode: product.listing_type === "Whole Lot" ? "lot" : "product",
      product,
      source: "WholesaleProductCard",
    });
  }

  return (
    <article className="product-card card card-interactive group relative flex h-full flex-col overflow-hidden">
      <Link href={`/product/${product.slug}`} className="absolute inset-0 z-0" aria-label={product.name} />
      <Link
        href={`/product/${product.slug}`}
        className="relative z-10 block aspect-[4/3] shrink-0 overflow-hidden bg-navy-50"
        aria-hidden="true"
        tabIndex={-1}
      >
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
          className="object-contain p-2 transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <ListingBadges badges={product.badges} className="absolute left-3 top-3" />
      </Link>

      <div className="product-card-body">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          {product.brand ? <p className="min-w-0 max-w-full truncate text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700">{product.brand}</p> : null}
          <StatusPill status={product.status} />
        </div>

        <h3 className="product-card-title">
          <Link href={`/product/${product.slug}`} className="relative z-10 hover:text-brand-700" aria-hidden="true" tabIndex={-1}>
            {product.name}
          </Link>
        </h3>

        <dl className="product-card-specs">
          <div className="min-w-0">
            <dt className="text-steel-500">SKU</dt>
            <dd className="truncate font-semibold text-navy-800" title={product.sku}>{product.sku}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-steel-500">Quantity available</dt>
            <dd className="break-words font-semibold text-navy-800">
              {product.quantity_available === null ? "Contact for quantity" : `${formatNumber(product.quantity_available)} units`}
            </dd>
          </div>
          <div className="min-w-0" data-extra>
            <dt className="text-steel-500">Added</dt>
            <dd className="break-words font-semibold text-navy-800">{relativeAdded(product.added_date)}</dd>
          </div>
          {product.warehouse_location ? (
            <div className="min-w-0" data-extra>
              <dt className="text-steel-500">Warehouse</dt>
              <dd className="truncate font-semibold text-navy-800">{product.warehouse_location}</dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {product.condition !== "Not provided" ? <ConditionPill condition={product.condition} /> : null}
        </div>

        <div className="mt-auto pt-4">
          <div className="border-t border-navy-100 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-steel-500">
              Wholesale &mdash; pricing on request
            </p>
          </div>

          <div className="product-card-actions">
            <button
              type="button"
              onClick={onWhatsApp}
              className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700"
              aria-label={`Ask for wholesale pricing on ${product.name} via WhatsApp`}
            >
              WhatsApp
            </button>
            <button type="button" onClick={onEnquire} className="btn-outline btn-sm">
              Enquire Now
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
