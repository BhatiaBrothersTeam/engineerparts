"use client";

import Link from "next/link";
import { useState } from "react";
import { ProductCard } from "@/components/cards/ProductCard";
import { RevealGroup } from "@/components/ui/Reveal";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "latest", label: "Latest" },
  { id: "lowest", label: "Lowest Price" },
  { id: "bulk", label: "Bulk Lots" },
  { id: "equipment", label: "Equipment" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ClearanceStockTabs({ productsByTab }: { productsByTab: Record<TabId, Product[]> }) {
  const [tab, setTab] = useState<TabId>("latest");
  const list = productsByTab[tab];

  return (
    <div>
      <div className="no-scrollbar -mx-4 mb-6 flex items-center gap-1 overflow-x-auto border-b border-navy-100 px-4 sm:mx-0 sm:gap-2 sm:px-0">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            aria-pressed={tab === item.id}
            className={cn(
              "-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition-colors sm:px-4",
              tab === item.id
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-steel-600 hover:text-navy-900",
            )}
          >
            {item.label}
          </button>
        ))}
        <Link
          href="/clearance"
          className="mb-2 ml-auto hidden shrink-0 text-sm font-semibold text-brand-700 hover:text-brand-500 sm:block"
        >
          View all clearance &rarr;
        </Link>
      </div>

      <RevealGroup className="product-grid-showcase">
        {list.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </RevealGroup>

      <div className="mt-6 flex justify-center sm:hidden">
        <Link href="/clearance" className="btn-outline">
          View all clearance stock
        </Link>
      </div>
    </div>
  );
}
