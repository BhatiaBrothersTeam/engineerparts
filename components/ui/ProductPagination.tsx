"use client";

import { useSearchParams } from "next/navigation";
import { formatNumber } from "@/lib/utils";

export const PRODUCT_PAGE_SIZE = 24;

export function useProductPage(total: number) {
  const params = useSearchParams();
  const requested = Number(params.get("page"));
  const pageCount = Math.max(1, Math.ceil(total / PRODUCT_PAGE_SIZE));
  const page = Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested, pageCount) : 1;
  return { page, pageCount, start: (page - 1) * PRODUCT_PAGE_SIZE };
}

export function updateProductParams(values: Record<string, string | string[]>, pageChange = false) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(values)) {
    url.searchParams.delete(key);
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item) url.searchParams.append(key, item);
    }
  }
  if (!pageChange) url.searchParams.delete("page");
  window.history[pageChange ? "pushState" : "replaceState"](null, "", url);
}

export function ProductPagination({ total, page, pageCount, gridId }: {
  total: number;
  page: number;
  pageCount: number;
  gridId: string;
}) {
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1)
    .filter((number) => number === 1 || number === pageCount || Math.abs(number - page) <= 1);
  function goToPage(next: number) {
    updateProductParams({ page: String(next) }, true);
    document.getElementById(gridId)?.scrollIntoView({ block: "start" });
  }

  return (
    <nav aria-label="Product pagination" className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-navy-100 pt-6">
      <p className="text-sm font-medium text-steel-700" aria-live="polite">
        Showing {formatNumber(total ? (page - 1) * PRODUCT_PAGE_SIZE + 1 : 0)}–{formatNumber(Math.min(page * PRODUCT_PAGE_SIZE, total))} of {formatNumber(total)} products
      </p>
      {pageCount > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-outline btn-sm" disabled={page === 1} onClick={() => goToPage(page - 1)}>Previous</button>
          {pages.map((number, index) => (
            <span key={number} className="flex items-center gap-2">
              {index > 0 && number > pages[index - 1] + 1 ? <span aria-hidden="true">…</span> : null}
              <button type="button" className={number === page ? "btn-primary btn-sm min-w-11" : "btn-outline btn-sm min-w-11"} aria-label={`Page ${number}`} aria-current={number === page ? "page" : undefined} onClick={() => goToPage(number)}>{number}</button>
            </span>
          ))}
          <button type="button" className="btn-outline btn-sm" disabled={page === pageCount} onClick={() => goToPage(page + 1)}>Next</button>
        </div>
      ) : null}
    </nav>
  );
}
