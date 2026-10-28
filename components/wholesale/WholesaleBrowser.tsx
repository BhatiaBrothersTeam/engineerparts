"use client";

import { useMemo, useState } from "react";
import { WholesaleProductCard } from "@/components/cards/WholesaleProductCard";
import { IconTile } from "@/components/ui/IconTile";
import { filterProducts } from "@/lib/search";
import type { Product } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

const PAGE_SIZE = 24;

export function WholesaleBrowser({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const results = useMemo(() => filterProducts(products, { q: query }), [products, query]);
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const pageItems = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const firstResult = results.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastResult = Math.min(page * PAGE_SIZE, results.length);

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  return (
    <div>
      <div className="card p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <IconTile>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
          </IconTile>
          <div>
            <p className="eyebrow text-brand-700">Find stock</p>
            <label htmlFor="wholesale-search" className="mt-1 block text-base font-bold text-navy-900">
              Search wholesale listings
            </label>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <input
              id="wholesale-search"
              type="search"
              className="field pl-10"
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              placeholder="Search by product, SKU, part number, brand or category"
            />
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
          </div>
          {query ? (
            <button type="button" className="btn-outline btn-sm" onClick={() => updateQuery("")}>
              Clear search
            </button>
          ) : null}
        </div>
        <div className="mt-4 border-t border-navy-100 pt-3">
          <p className="text-xs text-steel-600" aria-live="polite">
            {results.length
              ? `Showing ${formatNumber(firstResult)}–${formatNumber(lastResult)} of ${formatNumber(results.length)} listings`
              : "No matching wholesale listings"}
          </p>
        </div>
      </div>

      {pageItems.length ? (
        <>
          <div className="mt-6 product-grid">
            {pageItems.map((product) => (
              <WholesaleProductCard key={product.id} product={product} />
            ))}
          </div>

          {pageCount > 1 ? (
            <nav className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-navy-100 pt-6 sm:flex-row" aria-label="Wholesale listings pagination">
              <p className="text-sm text-steel-600">
                Page <span className="font-semibold text-navy-900">{page}</span> of{" "}
                <span className="font-semibold text-navy-900">{pageCount}</span>
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-outline btn-sm"
                  disabled={page === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  disabled={page === pageCount}
                  onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                >
                  Next
                </button>
              </div>
            </nav>
          ) : null}
        </>
      ) : (
        <div className="card mx-auto mt-6 flex max-w-xl flex-col items-center p-10 text-center">
          <IconTile>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
          </IconTile>
          <p className="mt-4 text-base font-bold text-navy-900">No matching wholesale stock</p>
          <p className="mt-2 max-w-md text-sm text-steel-600">
            Try another product name, SKU, part number, brand or category.
          </p>
          <button type="button" className="btn-outline btn-sm mt-5" onClick={() => updateQuery("")}>
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}
