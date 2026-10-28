"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/providers/CartProvider";
import { useEnquiry } from "@/components/providers/EnquiryProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { SaveProductButton } from "@/components/account/SaveProductButton";
import { ConditionPill, ListingBadges, StatusPill } from "@/components/ui/Badge";
import type { Product } from "@/lib/types";
import { WhatsAppIcon } from "@/components/Header";
import { track } from "@/lib/analytics";
import {
  absoluteUrl,
  cn,
  formatNumber,
  formatPrice,
  isPurchasable,
  openWhatsApp,
  productWhatsAppMessage,
  relativeAdded,
} from "@/lib/utils";

export function ProductCard({ product, layout = "grid" }: { product: Product; layout?: "grid" | "list" }) {
  const { addItem } = useCart();
  const { openEnquiry } = useEnquiry();
  const { toast } = useToast();

  const purchasable = isPurchasable(product.status) && product.price !== null && (product.quantity_available ?? 1) > 0;
  const wooPurchasable = isPurchasable(product.status) && product.price !== null && Boolean(product.woocommerce_checkout_url);
  const priceLabel = formatPrice(product.price, product.currency);
  const list = layout === "list";

  function onAddToCart() {
    if (!purchasable || product.price === null) return;
    addItem(
      {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        slug: product.slug,
        brand: product.brand,
        condition: product.condition,
        unitPrice: product.price,
        currency: product.currency,
        maxQuantity: product.quantity_available ?? 99,
        image: product.images[0],
        warehouse: product.warehouse_location,
      },
      1,
    );
    toast(`${product.sku} added to cart`);
  }

  function onWhatsApp() {
    track("whatsapp_click", { source: "ProductCard", sku: product.sku });
    openWhatsApp(
      productWhatsAppMessage({
        name: product.name,
        sku: product.sku,
        part_number: product.part_number,
        brand: product.brand,
        price: product.price === null ? undefined : priceLabel,
        url: absoluteUrl(`/product/${product.slug}`),
      }),
    );
  }

  function onWooCommerceCheckout() {
    if (!wooPurchasable || product.price === null) return;
    addItem({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      condition: product.condition,
      unitPrice: product.price,
      currency: product.currency,
      maxQuantity: product.quantity_available ?? 99,
      image: product.images[0],
      warehouse: product.warehouse_location,
    });
    window.location.assign("/checkout");
  }

  return (
    <article
      className={cn(
        "product-card card card-interactive group relative flex overflow-hidden",
        list ? "flex-col sm:flex-row" : "h-full flex-col",
      )}
    >
      <Link
        href={`/product/${product.slug}`}
        className="absolute inset-0 z-0"
        aria-label={product.name}
      />
      <SaveProductButton productId={product.id} compact className="absolute right-3 top-3 z-10" />
      <Link
        href={`/product/${product.slug}`}
        className={cn(
          "relative z-10 block shrink-0 overflow-hidden bg-navy-50",
          list ? "sm:w-64" : "",
        )}
        aria-hidden="true"
        tabIndex={-1}
      >
        <div className={cn("relative", list ? "aspect-[4/3] sm:h-full sm:aspect-auto" : "aspect-[4/3]")}>
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes={list ? "(max-width: 640px) 100vw, 256px" : "(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"}
            className="object-contain p-2 transition-transform duration-500 group-hover:scale-[1.03]"
          />
          {product.status === "Sold" ? (
            <div className="absolute inset-0 flex items-center justify-center bg-navy-950/55">
              <span className="rounded-sm border border-white/40 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white">
                Sold
              </span>
            </div>
          ) : null}
        </div>
        <ListingBadges badges={product.badges} className="absolute left-3 top-3" />
      </Link>

      <div className={cn("product-card-body", list ? "sm:p-5" : "")}>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          {product.brand ? <p className="min-w-0 max-w-full truncate text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700">{product.brand}</p> : null}
          <StatusPill status={product.status} />
        </div>

        <h3 className={cn("product-card-title", list && "sm:text-lg")}>
          <Link href={`/product/${product.slug}`} className="relative z-10 hover:text-brand-700" tabIndex={-1} aria-hidden="true">
            {product.name}
          </Link>
        </h3>

        <dl className="product-card-specs">
          <div className="min-w-0">
            <dt className="text-steel-500">SKU</dt>
            <dd className="truncate font-semibold text-navy-800" title={product.sku}>{product.sku}</dd>
          </div>
          <div className="min-w-0" data-extra>
            <dt className="text-steel-500">Part number</dt>
            <dd className="truncate font-semibold text-navy-800" title={product.part_number}>
              {product.part_number}
            </dd>
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
        </dl>

        {list ? <p className="mt-3 text-sm leading-relaxed text-steel-600">{product.description}</p> : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {product.condition !== "Not provided" ? <ConditionPill condition={product.condition} /> : null}
          {product.warehouse_location ? (
            <span className="text-[11px] text-steel-500">{product.warehouse_location}</span>
          ) : null}
        </div>

        <div className="mt-auto pt-4">
          <div className="border-t border-navy-100 pt-3">
            <p className="product-card-price">{priceLabel}</p>
          </div>

          <div className="product-card-actions">
            {product.listing_type === "Whole Lot" ? (
              <button
                type="button"
                onClick={() => openEnquiry({ mode: "lot", product })}
                className="btn-primary btn-sm product-card-wide"
              >
                Enquire for Whole Lot
              </button>
            ) : (
              <>
                {purchasable ? (
                  <button type="button" onClick={onAddToCart} className="btn-outline btn-sm">
                    Add to Cart
                  </button>
                ) : null}
                {wooPurchasable ? (
                  <button type="button" onClick={onWooCommerceCheckout} className="btn-primary btn-sm">
                    Buy Now
                  </button>
                ) : null}
                {purchasable ? null : (
                  <button
                    type="button"
                    onClick={() => openEnquiry({ mode: "product", product })}
                    className="btn-navy btn-sm product-card-wide"
                  >
                    {product.status === "Sold" ? "Enquire About Similar" : "Enquire Now"}
                  </button>
                )}
              </>
            )}
            <div className="product-card-wide flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              {purchasable && product.listing_type !== "Whole Lot" ? (
                <button
                  type="button"
                  onClick={() => openEnquiry({ mode: "product", product })}
                  className="link-underline inline-flex min-h-10 items-center whitespace-nowrap text-xs font-semibold text-steel-600 hover:text-brand-700"
                >
                  Enquire Now
                </button>
              ) : null}
              <button
                type="button"
                onClick={onWhatsApp}
                className="inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-emerald-700 transition-colors hover:text-emerald-800"
                aria-label={`Ask about ${product.name} on WhatsApp`}
              >
                <span className="shrink-0">
                  <WhatsAppIcon />
                </span>
                WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
