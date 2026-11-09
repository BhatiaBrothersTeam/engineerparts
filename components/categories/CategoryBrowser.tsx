"use client";

import { useMemo, useState } from "react";
import { CategoryShowcaseCard } from "@/components/cards/CategoryShowcaseCard";
import type { CategorySummaryItem } from "@/lib/categories";

const CATEGORY_TONES = [
  "bg-brand-50",
  "bg-navy-50",
  "bg-brand-100/70",
  "bg-steel-50",
  "bg-navy-100/70",
  "bg-brand-50/80",
] as const;

const SORT_OPTIONS = [
  { value: "count-desc", label: "Most products" },
  { value: "count-asc", label: "Fewest products" },
  { value: "az", label: "Category A - Z" },
  { value: "za", label: "Category Z - A" },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]["value"];
type CategoryWithImage = CategorySummaryItem & { image?: string };

export function CategoryBrowser({ categories }: { categories: CategoryWithImage[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("count-desc");

  const visibleCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const filtered = normalizedQuery
      ? categories.filter((category) =>
          `${category.label} ${category.slug}`.toLocaleLowerCase().includes(normalizedQuery),
        )
      : categories;

    return [...filtered].sort((a, b) => {
      if (sort === "count-asc") return a.count - b.count || a.label.localeCompare(b.label);
      if (sort === "az") return a.label.localeCompare(b.label);
      if (sort === "za") return b.label.localeCompare(a.label);
      return b.count - a.count || a.label.localeCompare(b.label);
    });
  }, [categories, query, sort]);

  return (
    <>
      <div className="card mb-6 grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-5">
        <label>
          <span className="field-label">Search categories</span>
          <span className="relative block">
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m16 16 4 4" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by category name..."
              className="field pl-10"
            />
          </span>
        </label>

        <label className="sm:min-w-52">
          <span className="field-label">Sort categories</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)} className="field">
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mb-4 flex min-h-8 items-center justify-between gap-4">
        <p aria-live="polite" className="text-sm font-semibold text-steel-600">
          {visibleCategories.length} {visibleCategories.length === 1 ? "category" : "categories"}
        </p>
        {query ? (
          <button type="button" onClick={() => setQuery("")} className="text-sm font-semibold text-brand-700 hover:text-brand-500">
            Clear search
          </button>
        ) : null}
      </div>

      {visibleCategories.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:gap-5 xl:grid-cols-3">
          {visibleCategories.map((category, index) => (
            <CategoryShowcaseCard
              key={category.slug}
              category={category}
              image={category.image}
              tone={CATEGORY_TONES[index % CATEGORY_TONES.length]}
              imageSizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="h-full"
            />
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center sm:p-10">
          <h2 className="text-h3 text-navy-900">No matching categories</h2>
          <p className="mt-2 text-sm text-steel-600">Try another category name or clear your search.</p>
          <button type="button" onClick={() => setQuery("")} className="btn-outline btn-sm mt-5">
            Clear search
          </button>
        </div>
      )}
    </>
  );
}
