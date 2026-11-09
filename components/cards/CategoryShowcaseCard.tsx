import Image from "next/image";
import Link from "next/link";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import type { CategorySummaryItem } from "@/lib/categories";
import { src } from "@/lib/images";
import { cn, formatNumber } from "@/lib/utils";

export function CategoryShowcaseCard({
  category,
  image,
  tone,
  imageSizes = "(max-width: 768px) 55vw, 32vw",
  className,
}: {
  category: CategorySummaryItem;
  image?: string;
  tone: string;
  imageSizes?: string;
  className?: string;
}) {
  return (
    <Link
      href={`/clearance/${category.slug}`}
      className={cn(
        "category-showcase-card group relative block min-h-[240px] overflow-hidden rounded-card border border-navy-100/80 p-6 shadow-card",
        "transition-[transform,box-shadow,border-color] duration-500 ease-[var(--ease-out-soft)] hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-lift",
        tone,
        className,
      )}
    >
      <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/80 bg-white text-brand-700 shadow-card transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-brand-600 group-hover:text-white">
        <CategoryIcon category={category.slug} className="h-5 w-5" />
      </span>
      <span className="absolute right-6 top-6 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/90 text-lg text-navy-700 shadow-card backdrop-blur transition-all duration-300 group-hover:translate-x-1 group-hover:bg-navy-900 group-hover:text-white">
        &rarr;
      </span>

      {image ? (
        <Image
          src={src(image, 700, 700)}
          alt=""
          fill
          sizes={imageSizes}
          className="pointer-events-none !bottom-0 !left-auto !right-0 !top-auto !h-[70%] !w-[52%] object-contain object-right-bottom p-3 drop-shadow-xl mix-blend-multiply transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:translate-x-1 group-hover:scale-110"
        />
      ) : null}

      <div className="absolute bottom-6 left-6 z-10 max-w-[58%]">
        <h3 className="text-h3 text-navy-900 transition-colors group-hover:text-brand-700">
          {category.label}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-steel-600">
          Browse available {category.label.toLowerCase()} clearance stock.
        </p>
        <span className="mt-3 inline-flex rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-semibold text-navy-700 shadow-sm">
          {formatNumber(category.count)} products
        </span>
      </div>
    </Link>
  );
}
