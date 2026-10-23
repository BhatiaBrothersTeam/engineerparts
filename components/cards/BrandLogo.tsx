"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function BrandLogo({ name, logoUrl, className }: { name: string; logoUrl: string | null; className?: string }) {
  const [failed, setFailed] = useState(false);
  const src = logoUrl;

  if (!src || failed) {
    return (
      <span className={cn("icon-tile display shrink-0 text-lg font-extrabold text-brand-600", className)} aria-hidden="true">
        {name.slice(0, 1)}
      </span>
    );
  }

  return (
    <span className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-navy-100 bg-white p-1.5", name.trim().toLowerCase() === "sawyer mfg.co." && "bg-navy-900", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- supports mixed logo formats from the verified, self-hosted brand assets */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="h-full w-full object-contain"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
