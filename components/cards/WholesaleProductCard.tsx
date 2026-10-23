"use client";

import Image from "next/image";
import Link from "next/link";
import { ConditionPill, ListingBadges, StatusPill } from "@/components/ui/Badge";
import { useToast } from "@/components/providers/ToastProvider";
import { track } from "@/lib/analytics";
import type { Product } from "@/lib/types";
import { CONTACT_EMAIL, absoluteUrl, formatNumber, mailtoLink, productWhatsAppMessage, relativeAdded, whatsappLink } from "@/lib/utils";

export function WholesaleProductCard({ product }: { product: Product }) {
  const { toast } = useToast();

  const listingUrl = absoluteUrl(`/product/${product.slug}`);
  const message = productWhatsAppMessage({
    name: product.name,
    sku: product.sku,
    part_number: product.part_number,
    url: listingUrl,
  });
  const emailBody = [
    `Hello Engineerparts.com, I would like to enquire about bulk availability for:`,
    ``,
    `Product: ${product.name}`,
    `SKU: ${product.sku}`,
    product.part_number ? `Part number: ${product.part_number}` : "",
    `Listing: ${listingUrl}`,
    ``,
    `Quantity required: `,
  ]
    .filter(Boolean)
    .join("\n");

  function onWhatsApp() {
    track("whatsapp_click", { source: "WholesaleProductCard", sku: product.sku });
  }

  function onEmail() {
    track("email_click", { source: "WholesaleProductCard", sku: product.sku });
    toast(`Drafting an email enquiry for ${product.sku}`);
  }

  return (
    <article className="card card-interactive group relative flex h-full flex-col overflow-hidden">
      <Link href={`/product/${product.slug}`} className="relative block aspect-[4/3] shrink-0 overflow-hidden bg-navy-50">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-contain p-2 transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <ListingBadges badges={product.badges} className="absolute left-3 top-3" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          {product.brand ? <p className="min-w-0 truncate text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700">{product.brand}</p> : null}
          <StatusPill status={product.status} />
        </div>

        <h3 className="mt-2 line-clamp-2 min-h-10 break-words text-[15px] font-bold leading-snug text-navy-900">
          <Link href={`/product/${product.slug}`} className="hover:text-brand-700">
            {product.name}
          </Link>
        </h3>

        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
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
          <div className="min-w-0">
            <dt className="text-steel-500">Added</dt>
            <dd className="break-words font-semibold text-navy-800">{relativeAdded(product.added_date)}</dd>
          </div>
          {product.warehouse_location ? (
            <div className="min-w-0">
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

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <a
              href={whatsappLink(message)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onWhatsApp}
              className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700"
            >
              WhatsApp
            </a>
            {CONTACT_EMAIL ? (
              <a
                href={mailtoLink(CONTACT_EMAIL, `Bulk enquiry: ${product.name}`, emailBody)}
                onClick={onEmail}
                className="btn-outline btn-sm"
              >
                Email
              </a>
            ) : (
              <Link href="/enquiry" className="btn-outline btn-sm">
                Enquire
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
