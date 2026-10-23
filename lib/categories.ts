import type { Product } from "@/lib/types";
import { isPublicProductValue } from "@/lib/utils";

export interface CategorySummaryItem {
  slug: string;
  label: string;
  count: number;
}

export function humanizeCategorySlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => (word.length <= 3 ? word.toUpperCase() : word[0].toUpperCase() + word.slice(1)))
    .join(" ");
}

export function categorySummary(products: Product[]): CategorySummaryItem[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    if (!isPublicProductValue(product.category) || product.category === "uncategorised") continue;
    counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
  }
  return Array.from(counts, ([slug, count]) => ({ slug, label: humanizeCategorySlug(slug), count })).sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label),
  );
}

export function categoryLabel(products: Product[], slug: string): string {
  const match = products.find((product) => product.category === slug);
  return match ? humanizeCategorySlug(match.category) : humanizeCategorySlug(slug);
}
