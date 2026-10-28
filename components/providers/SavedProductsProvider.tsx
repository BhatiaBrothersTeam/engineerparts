"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { CustomerError, customerErrorMessage, customerRequest } from "@/lib/customer-feedback";
import { logError } from "@/lib/logger";

const STORAGE_KEY = "engineerparts.saved-products";

interface SavedProductsContextValue {
  ready: boolean;
  isSaved: (productId: string) => boolean;
  toggle: (productId: string) => Promise<boolean>;
}

const SavedProductsContext = createContext<SavedProductsContextValue | null>(null);

function readGuest(): string[] {
  try { const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]") as unknown; return Array.isArray(value) ? value.map(String).filter((id) => /^\d+$/.test(id)).slice(0, 100) : []; } catch (error) { logError("saved_products.storage_read_failed", { error }); throw new CustomerError("Browser-saved products could not be loaded. Allow site storage and refresh, or sign in to use your account's saved products."); }
}

export function SavedProductsProvider({ children }: { children: React.ReactNode }) {
  const { authenticated, loading } = useAuth();
  const { toast } = useToast();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    let guest: string[];
    try {
      guest = readGuest();
    } catch (error) {
      toast(customerErrorMessage(error, "Browser-saved products could not be loaded. Allow site storage and refresh."), "error");
      guest = [];
    }
    if (!authenticated) { setIds(new Set(guest)); setReady(true); return; }
    setReady(false);
    let cancelled = false;
    customerRequest<{ productIds: number[] }>("/api/account/saved-products", { cache: "no-store" }, "Saved products could not be loaded. Refresh to retry; your existing saved products have not been removed.")
      .then(async (data) => {
        if (cancelled) return;
        const account = new Set(data.productIds.map(String));
        const missing = guest.filter((id) => !account.has(id));
        const merged = await Promise.allSettled(missing.map(async (productId) => {
          await customerRequest("/api/account/saved-products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId }) }, "Some products could not be saved to your account. Refresh to retry.");
          return productId;
        }));
        if (cancelled) return;
        const failed = merged.some((result) => result.status === "rejected");
        merged.forEach((result) => { if (result.status === "fulfilled") account.add(result.value); });
        if (failed) toast("Some products could not be saved to your account. Refresh to retry; your browser copy has been kept.", "error");
        else if (guest.length) {
          try {
            window.localStorage.removeItem(STORAGE_KEY);
          } catch (error) {
            logError("saved_products.storage_clear_failed", { error });
            toast("Products were saved to your account, but the browser copy could not be cleared. Allow site storage to remove it.", "error");
          }
        }
        setIds(account); setReady(true);
      })
      .catch((error) => {
        if (!cancelled) {
          logError("saved_products.load_failed", { error });
          setReady(false);
          toast(customerErrorMessage(error, "Saved products could not be loaded. Refresh to retry; your browser copy has been kept."), "error");
        }
      });
    return () => { cancelled = true; };
  }, [authenticated, loading, toast]);

  const toggle = useCallback(async (productId: string) => {
    if (authenticated) {
      const data = await customerRequest<{ saved?: boolean; productIds?: number[] }>("/api/account/saved-products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId }) }, "Your saved products could not be updated. Refresh to check the latest list, then retry.");
      if (typeof data.saved !== "boolean" || !Array.isArray(data.productIds)) throw new CustomerError("Your saved products could not be confirmed. Refresh to check the latest list before retrying.");
      setIds(new Set((data.productIds ?? []).map(String)));
      return data.saved;
    }
    const next = new Set(ids);
    const saved = !next.has(productId);
    if (saved) next.add(productId); else next.delete(productId);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    } catch (error) {
      logError("saved_products.storage_write_failed", { error });
      throw new CustomerError("Your browser could not save this product. Allow site storage or sign in to save products to your account.");
    }
    setIds(next);
    return saved;
  }, [authenticated, ids]);

  const value = useMemo(() => ({ ready, isSaved: (productId: string) => ids.has(productId), toggle }), [ids, ready, toggle]);
  return <SavedProductsContext.Provider value={value}>{children}</SavedProductsContext.Provider>;
}

export function useSavedProducts(): SavedProductsContextValue {
  const context = useContext(SavedProductsContext);
  if (!context) throw new Error("useSavedProducts must be used inside SavedProductsProvider");
  return context;
}