"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Customer, UserSession } from "@/lib/account";
import { readLeads } from "@/lib/leads";
import { CART_CUSTOMER_STORAGE_KEY, useCart } from "@/components/providers/CartProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { logError } from "@/lib/logger";
import { CustomerError, customerErrorMessage, customerRequest, customerResponseMessage } from "@/lib/customer-feedback";

interface AuthContextValue extends UserSession {
  loading: boolean;
  refreshUser: () => Promise<Customer | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { selectCustomer } = useCart();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionResolved = useRef(false);
  const requestRevision = useRef(0);

  const refreshUser = useCallback(async () => {
    const revision = ++requestRevision.current;
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (revision !== requestRevision.current) return null;
      if (response.status === 401) {
        selectCustomer(null);
        sessionResolved.current = true;
        setCustomer(null);
        return null;
      }
      if (!response.ok) throw new CustomerError(customerResponseMessage(response.status, null, "Your account could not be loaded. Check your connection and refresh the page."));
      const data = (await response.json()) as UserSession;
      if (revision !== requestRevision.current) return null;
      const nextCustomer = response.ok ? data.customer : null;
      selectCustomer(nextCustomer?.id ?? null);
      sessionResolved.current = true;
      setCustomer(nextCustomer);
      if (nextCustomer) {
        const references = readLeads().map((lead) => lead.lead_id);
        if (references.length) {
          void customerRequest("/api/account/enquiries/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ references }) }, "Your earlier enquiries could not be linked to your account. Refresh to retry, or contact support with your enquiry references.")
            .catch((error) => toast(customerErrorMessage(error, "Your enquiries could not be linked. Contact support with your enquiry references."), "error"));
        }
      }
      return nextCustomer;
    } catch (error) {
      if (revision !== requestRevision.current) return null;
      if (!sessionResolved.current) selectCustomer(null);
      logError("account.load_failed", { error });
      toast(customerErrorMessage(error, "Your account could not be loaded. Check your connection and refresh the page."), "error");
      return null;
    } finally {
      if (revision === requestRevision.current) setLoading(false);
    }
  }, [selectCustomer, toast]);

  useEffect(() => {
    void refreshUser();
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea === window.localStorage && (event.key === CART_CUSTOMER_STORAGE_KEY || event.key === null)) void refreshUser();
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) void refreshUser();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await customerRequest("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", cache: "no-store" }, "Sign-out could not be confirmed. Check your connection and try again. On a shared device, close this browser when finished.");
      requestRevision.current += 1;
      selectCustomer(null);
      sessionResolved.current = true;
      setCustomer(null);
      setLoading(false);
      router.push("/");
      router.refresh();
    } catch (error) {
      logError("account.logout_failed", { error });
      toast(customerErrorMessage(error, "Sign-out could not be confirmed. Check your connection and try again. On a shared device, close this browser when finished."), "error");
    }
  }, [selectCustomer, router, toast]);

  const value = useMemo(() => ({
    authenticated: Boolean(customer),
    customer,
    loading,
    refreshUser,
    logout,
  }), [customer, loading, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}