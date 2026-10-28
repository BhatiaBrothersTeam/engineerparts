"use client";

import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { useEffect, useState } from "react";
import {
  OPEN_COOKIE_SETTINGS_EVENT,
  readCookieConsent,
  saveCookieConsent,
  type CookieConsent as Consent,
} from "@/lib/cookie-consent";

export function CookieConsent() {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    setConsent(readCookieConsent());
    setReady(true);
    const openSettings = () => {
      setAnalyticsEnabled(readCookieConsent() === "accepted");
      setCustomizing(true);
      setSettingsOpen(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, openSettings);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, openSettings);
  }, []);

  function choose(value: Consent) {
    saveCookieConsent(value);
    setConsent(value);
    setCustomizing(false);
    setSettingsOpen(false);
  }

  return (
    <>
      {consent === "accepted" ? <Analytics /> : null}
      {ready && (consent === null || settingsOpen) ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-consent-title"
            aria-describedby="cookie-consent-description"
            className="w-full max-w-xl rounded-card border border-navy-100 bg-white p-5 shadow-lift sm:p-7"
          >
            <p className="eyebrow text-brand-700">Privacy preferences</p>
            <h2 id="cookie-consent-title" className="text-h2 mt-2 text-navy-950">
              We value your privacy
            </h2>
            <p id="cookie-consent-description" className="mt-3 text-sm leading-6 text-steel-700">
              We use cookies to enhance your browsing experience, provide essential website
              functions, and analyse our traffic. By clicking “Accept All”, you consent to our use
              of optional analytics. Read our{" "}
              <Link href="/privacy-policy" className="font-semibold text-brand-700 underline underline-offset-2">
                Privacy Policy
              </Link>
              .
            </p>

            {customizing ? (
              <div className="mt-5 space-y-3 rounded-card border border-navy-100 bg-navy-50/60 p-4">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-navy-900">Essential cookies</p>
                    <p className="mt-0.5 text-xs text-steel-600">Required for sign-in, cart and core features.</p>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wide text-steel-500">Always on</span>
                </div>
                <label className="flex cursor-pointer items-center justify-between gap-4 border-t border-navy-100 pt-3 text-sm">
                  <span>
                    <span className="block font-semibold text-navy-900">Analytics cookies</span>
                    <span className="mt-0.5 block text-xs text-steel-600">Help us understand and improve the website.</span>
                  </span>
                  <input
                    type="checkbox"
                    className="h-5 w-5 shrink-0 accent-brand-600"
                    checked={analyticsEnabled}
                    onChange={(event) => setAnalyticsEnabled(event.target.checked)}
                  />
                </label>
              </div>
            ) : null}

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {customizing ? (
                <button type="button" className="btn-outline" onClick={() => choose(analyticsEnabled ? "accepted" : "rejected")}>
                  Save preferences
                </button>
              ) : (
                <button type="button" className="btn-outline" onClick={() => setCustomizing(true)}>
                  Customize
                </button>
              )}
              <button type="button" className="btn-outline" onClick={() => choose("rejected")}>
                Reject All
              </button>
              <button type="button" className="btn-primary" onClick={() => choose("accepted")}>
                Accept All
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
