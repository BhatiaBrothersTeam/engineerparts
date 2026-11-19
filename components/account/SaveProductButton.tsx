"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useSavedProducts } from "@/components/providers/SavedProductsProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { HeartIcon } from "@/components/ui/HeartIcon";
import { cn } from "@/lib/utils";
import { customerErrorMessage } from "@/lib/customer-feedback";

export function SaveProductButton({ productId, compact = false, className }: { productId: string; compact?: boolean; className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, busy, isSaved, toggle } = useSavedProducts();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const saved = isSaved(productId);
  const label = saved ? "Remove from saved products" : "Save product";

  async function onClick() {
    if (pending.current) return;
    pending.current = true;
    setSaving(true);
    try {
      const next = await toggle(productId);
      toast(next ? "Product saved." : "Product removed from saved products.", "info");
      if (pathname === "/account/saved-products") router.refresh();
    } catch (caught) {
      toast(customerErrorMessage(caught, "Your saved products could not be updated. Refresh and retry, or sign in to save products to your account."), "error");
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  return (
    <button type="button" onClick={() => void onClick()} disabled={!ready || busy || saving} aria-busy={saving}
      className={cn(compact ? "save-heart h-11 w-11 shrink-0" : "btn-outline save-heart", saved && "is-saved", className)}
      aria-label={saving ? "Updating saved product" : label} aria-pressed={saved} title={label}>
      {saving ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" /> : <HeartIcon filled={saved} />}
      {compact ? null : <span>{saving ? "Saving…" : saved ? "Saved" : "Save Product"}</span>}
    </button>
  );
}
