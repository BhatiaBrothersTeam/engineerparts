import Link from "next/link";
import type { Brand } from "@/lib/types";
import { BrandLogo } from "@/components/cards/BrandLogo";

export function BrandCard({ brand, count }: { brand: Brand; count: number }) {
  return (
    <Link
      href={`/brands/${brand.slug}`}
      className="card card-interactive group flex flex-col justify-between p-6"
    >
      <div className="flex items-start gap-3.5">
        <BrandLogo name={brand.logoText} logoUrl={brand.logoUrl} className="h-11 w-11" />
        <div className="min-w-0">
          <span className="display block truncate text-lg font-extrabold tracking-tight text-navy-900 transition-colors group-hover:text-brand-700">
            {brand.logoText}
          </span>
          <span className="mt-1 block truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-steel-400">
            {brand.sectors[0]}
          </span>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-navy-100 pt-3">
        <span className="text-xs font-semibold text-navy-700">{count} clearance items</span>
        <span aria-hidden className="text-brand-600 transition-transform group-hover:translate-x-1">
          &rarr;
        </span>
      </div>
    </Link>
  );
}
