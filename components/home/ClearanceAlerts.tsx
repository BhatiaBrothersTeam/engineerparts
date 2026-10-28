"use client";

import { useId, useState } from "react";
import { customerErrorMessage, customerRequest } from "@/lib/customer-feedback";

export function ClearanceAlerts() {
  const errorId = useId();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setState("sending");
    try {
      await customerRequest("/api/clearance-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }, "Your subscription could not be confirmed. Try again shortly, or contact support if it keeps failing.");
      setState("done");
    } catch (cause) {
      setState("idle");
      setError(customerErrorMessage(cause, "Your subscription could not be confirmed. Try again shortly or contact support."));
    }
  }

  return (
    <div>
      <div>
        <h2 className="eyebrow text-white">Clearance alerts. No spam.</h2>
        <p className="mt-3 text-xs leading-relaxed text-steel-400">
          Sign up for the latest clearance stock and new arrivals.
        </p>
      </div>
      <div className="mt-4" aria-live="polite">
        {state === "done" ? (
          <div role="status" className="break-words rounded-md border border-emerald-800 bg-emerald-950 px-3 py-3 text-xs text-emerald-200">
            Your email ({email}) has been saved for future clearance alerts.
          </div>
        ) : (
          <>
          <label htmlFor={`${errorId}-email`} className="mb-2 block text-xs text-steel-300">Email address <span className="text-brand-300">*</span> (required)</label>
          <form onSubmit={onSubmit} className="flex rounded-full border border-white/20 bg-white p-1 text-navy-900 shadow-sm transition-colors hover:border-white/50 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-400/40">
            <input
              id={`${errorId}-email`}
              type="email"
              name="email"
              autoComplete="email"
              maxLength={191}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email..."
              aria-label="Email address"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className="min-h-11 min-w-0 flex-1 rounded-full bg-transparent pl-3 pr-1 text-base outline-none placeholder:text-steel-500 focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-xs"
              required
            />
            <button
              type="submit"
              disabled={state === "sending"}
              aria-label={state === "sending" ? "Subscribing..." : "Subscribe"}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-wait disabled:opacity-50"
            >
              {state === "sending" ? (
                <span aria-hidden="true" className="text-xs">...</span>
              ) : (
                <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </form>
          </>
        )}
        {error ? <p id={errorId} role="alert" className="mt-2 text-xs text-brand-300">{error}</p> : null}
      </div>
    </div>
  );
}
