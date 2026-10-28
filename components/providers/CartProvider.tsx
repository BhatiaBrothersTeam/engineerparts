"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CartItem, CartTotals } from "@/lib/types";
import { track } from "@/lib/analytics";
import { logError } from "@/lib/logger";
import { useToast } from "@/components/providers/ToastProvider";

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingLabel: string;
  freeShippingRemaining?: number;
  freeShippingLabel?: string;
  quoteLoading: boolean;
  quoteError: boolean;
  quoteCountry: string;
  setQuoteCountry: (country: string) => void;
  ready: boolean;
  stockValid: boolean;
  refreshQuote: () => void;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  selectCustomer: (customerId: number | null) => void;
  quantityFor: (productId: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "engineerparts.cart.v2";
export const CART_CUSTOMER_STORAGE_KEY = "engineerparts.cart.customer";

function cartStorageKey(customerId: number | null | undefined) {
  return customerId == null ? STORAGE_KEY : `${STORAGE_KEY}.customer.${customerId}`;
}

function readCart(customerId: number | null): CartItem[] {
  const raw = window.localStorage.getItem(cartStorageKey(customerId));
  const saved: unknown = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(saved) || !saved.every((item): item is CartItem =>
    item !== null && typeof item === "object" &&
    ["productId", "sku", "name", "slug", "brand", "currency", "image", "warehouse"].every((key) => typeof item[key] === "string") &&
    ["Not provided", "New Surplus", "New Old Stock", "Refurbished", "Used - Good", "Used - Fair", "For Parts / Repair"].includes(item.condition) &&
    Number.isFinite(item.unitPrice) && item.unitPrice >= 0 &&
    Number.isSafeInteger(item.quantity) && item.quantity > 0 &&
    Number.isSafeInteger(item.maxQuantity) && item.maxQuantity >= 0
  )) throw new Error("Invalid saved cart");
  return saved;
}

function readCartCustomer(raw: string | null): number | null {
  const saved: unknown = JSON.parse(raw ?? "null");
  if (saved === null || (typeof saved === "number" && Number.isSafeInteger(saved) && saved > 0)) return saved;
  throw new Error("Invalid saved cart customer");
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [quote, setQuote] = useState<CartTotals | null>(null);
  const [quoteCountry, setQuoteCountry] = useState("AE");
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(false);
  const [quoteRevision, setQuoteRevision] = useState(0);
  const [customerId, setCustomerId] = useState<number | null | undefined>(undefined);
  const owner = useRef<number | null | undefined>(undefined);
  const currentItems = useRef(items);
  const storageLoaded = useRef(false);
  currentItems.current = items;
  const refreshQuote = useCallback(() => setQuoteRevision((revision) => revision + 1), []);

  useEffect(() => {
    if (!ready || customerId === undefined || owner.current !== customerId || !storageLoaded.current) return;
    try {
      // A stale tab must not overwrite a cart after another tab changes accounts.
      if (window.localStorage.getItem(CART_CUSTOMER_STORAGE_KEY) !== JSON.stringify(customerId)) return;
      window.localStorage.setItem(cartStorageKey(customerId), JSON.stringify(items));
    } catch {
      logError("cart.storage_write_failed");
      toast("Your browser could not save the cart. Keep this page open, or allow site storage to keep products after reloading.", "error");
    }
  }, [items, ready, customerId, toast]);

  useEffect(() => {
    if (!ready || !items.length) {
      setQuote(null);
      setQuoteLoading(false);
      setQuoteError(false);
      return;
    }

    const controller = new AbortController();
    setQuote(null);
    setQuoteLoading(true);
    setQuoteError(false);
    fetch("/api/cart/totals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        country: quoteCountry,
        items: items.map(({ productId, quantity }) => ({ productId, quantity })),
      }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to calculate totals");
        const nextQuote = (await response.json()) as CartTotals;
        if (controller.signal.aborted) return;
        setQuote(nextQuote);
        if (nextQuote.stockLimits) {
          setItems((current) => {
            let changed = false;
            const next = current.map((line) => {
              const stock = nextQuote.stockLimits?.find(({ productId }) => productId === line.productId);
              if (!stock || stock.maxQuantity === null) return line;
              const quantity = stock.maxQuantity > 0
                ? Math.min(line.quantity, stock.maxQuantity)
                : line.quantity;
              if (line.maxQuantity === stock.maxQuantity && line.quantity === quantity) return line;
              changed = true;
              return {
                ...line,
                maxQuantity: stock.maxQuantity,
                quantity,
              };
            });
            return changed ? next : current;
          });
        }
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          logError("cart.quote_failed", { error });
          setQuote(null);
          setQuoteError(true);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setQuoteLoading(false);
      });

    return () => controller.abort();
  }, [items, quoteCountry, ready, quoteRevision]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((line) => line.productId === item.productId);
      if (existing) {
        const next = Math.min(existing.quantity + quantity, item.maxQuantity);
        return current.map((line) =>
          line.productId === item.productId ? { ...line, quantity: next } : line,
        );
      }
      return [...current, { ...item, quantity: Math.min(quantity, item.maxQuantity) }];
    });
    track("add_to_cart", {
      product_id: item.productId,
      sku: item.sku,
      quantity,
      unit_price: item.unitPrice,
      value: item.unitPrice * quantity,
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((current) =>
      current
        .map((line) =>
          line.productId === productId
            ? { ...line, quantity: Math.max(1, Math.min(quantity, line.maxQuantity)) }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((current) => {
      const line = current.find((item) => item.productId === productId);
      if (line) {
        track("remove_from_cart", { product_id: productId, sku: line.sku, quantity: line.quantity });
      }
      return current.filter((item) => item.productId !== productId);
    });
  }, []);

  const resetCart = useCallback((clearReference = true) => {
    currentItems.current = [];
    setItems([]);
    setQuote(null);
    setQuoteCountry("AE");
    setQuoteLoading(false);
    setQuoteError(false);
    if (!clearReference) return;
    try {
      window.sessionStorage.removeItem("engineerparts.checkout.reference");
    } catch (error) {
      logError("cart.checkout_reference_clear_failed", { error });
    }
  }, []);

  const clear = useCallback(() => {
    resetCart();
    try {
      window.localStorage.removeItem(cartStorageKey(owner.current));
    } catch (error) {
      logError("cart.storage_clear_failed", { error });
      toast("The cart is empty on this page, but saved browser data could not be cleared. Allow site storage and clear the cart again before leaving a shared device.", "error");
    }
  }, [resetCart, toast]);

  const loadCustomerCart = useCallback((nextCustomerId: number | null, publish = true) => {
    let nextItems: CartItem[] = [];
    const previousOwner = owner.current;
    const canSave = storageLoaded.current;
    let ownerChanged = previousOwner !== undefined && previousOwner !== nextCustomerId;
    storageLoaded.current = false;
    try {
      const savedOwner = readCartCustomer(window.localStorage.getItem(CART_CUSTOMER_STORAGE_KEY));
      ownerChanged ||= savedOwner !== nextCustomerId;
      const savePrevious = publish && canSave && previousOwner !== undefined && savedOwner === previousOwner;
      if (savePrevious) {
        window.localStorage.setItem(cartStorageKey(previousOwner), JSON.stringify(currentItems.current));
      }
      nextItems = readCart(nextCustomerId);
      const mergeGuest = publish && nextCustomerId !== null && ((savePrevious && previousOwner === null) || (previousOwner === undefined && savedOwner === null));
      const additions = [
        ...(publish && previousOwner === undefined ? currentItems.current : []),
        ...(mergeGuest ? (previousOwner === undefined ? readCart(null) : currentItems.current) : []),
      ];
      for (const item of additions) {
        const existing = nextItems.find((line) => line.productId === item.productId);
        if (existing) existing.quantity = Math.min(existing.quantity + item.quantity, existing.maxQuantity);
        else nextItems.push(item);
      }
      if (mergeGuest) {
        window.localStorage.setItem(cartStorageKey(nextCustomerId), JSON.stringify(nextItems));
        window.localStorage.removeItem(STORAGE_KEY);
      }
      if (publish) window.localStorage.setItem(CART_CUSTOMER_STORAGE_KEY, JSON.stringify(nextCustomerId));
      storageLoaded.current = true;
    } catch (error) {
      logError("cart.customer_storage_failed", { error });
      toast("Your saved cart could not be loaded or saved. Allow site storage and refresh before changing your cart. Saved carts are only available in this browser.", "error");
    }
    owner.current = nextCustomerId;
    setCustomerId(nextCustomerId);
    resetCart(ownerChanged);
    currentItems.current = nextItems;
    setItems(nextItems);
    setReady(true);
  }, [resetCart, toast]);

  const selectCustomer = useCallback((nextCustomerId: number | null) => {
    if (owner.current !== nextCustomerId) loadCustomerCart(nextCustomerId);
  }, [loadCustomerCart]);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.storageArea !== window.localStorage) return;
      if (event.key === CART_CUSTOMER_STORAGE_KEY && event.newValue !== null) {
        try {
          loadCustomerCart(readCartCustomer(event.newValue), false);
        } catch (error) {
          resetCart();
          logError("cart.customer_sync_failed", { error });
          toast("Your cart could not be synchronized. Refresh this page before continuing.", "error");
        }
      } else if (event.key === null) {
        owner.current = undefined;
        storageLoaded.current = false;
        setCustomerId(undefined);
        setReady(false);
        resetCart();
      } else if (event.key === cartStorageKey(owner.current) && (event.newValue === null || event.newValue === "[]")) {
        resetCart();
      }
    }

    function onPageShow(event: PageTransitionEvent) {
      if (!event.persisted) return;
      try {
        loadCustomerCart(readCartCustomer(window.localStorage.getItem(CART_CUSTOMER_STORAGE_KEY)), false);
      } catch (error) {
        logError("cart.restore_check_failed", { error });
        toast("Your saved cart could not be checked. Refresh this page before continuing.", "error");
      }
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [loadCustomerCart, resetCart, toast]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, line) => sum + line.quantity, 0);
    const localSubtotal = items.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
    const subtotal = quote?.subtotal ?? localSubtotal;
    const stockValid = Boolean(quote?.stockLimits) &&
      items.every((line) => line.maxQuantity > 0 && line.quantity <= line.maxQuantity);
    return {
      items,
      count,
      subtotal,
      shipping: quote?.shipping ?? 0,
      tax: quote?.tax ?? 0,
      total: quote?.total ?? localSubtotal,
      shippingLabel: quote?.shippingLabel ?? "Shipping",
      freeShippingRemaining: quote?.freeShippingRemaining,
      freeShippingLabel: quote?.freeShippingLabel,
      quoteLoading,
      quoteError,
      quoteCountry,
      setQuoteCountry,
      ready,
      stockValid,
      refreshQuote,
      addItem,
      updateQuantity,
      removeItem,
      clear,
      selectCustomer,
      quantityFor: (productId: string) =>
        items.find((line) => line.productId === productId)?.quantity ?? 0,
    };
  }, [items, quote, quoteCountry, quoteLoading, quoteError, ready, refreshQuote, addItem, updateQuantity, removeItem, clear, selectCustomer]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
