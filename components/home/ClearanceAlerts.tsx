"use client";

import { useState } from "react";

export function ClearanceAlerts() {
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
      const response = await fetch("/api/clearance-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to save your email.");
      setState("done");
    } catch (cause) {
      setState("idle");
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="rounded-card border border-navy-100 bg-navy-50 p-6 sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <p className="eyebrow text-brand-600">Clearance alerts</p>
          <h2 className="mt-2 text-xl font-extrabold text-navy-900 sm:text-2xl">
            Get the latest clearance stock
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-steel-600">
            Register your email for upcoming clearance stock alerts. 
          </p>
        </div>
        <div>
          {state === "done" ? (
            <div className="rounded-md border border-emerald-200 bg-white px-4 py-4 text-sm font-semibold text-emerald-800">
              Your email ({email}) has been saved for future clearance alerts.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                maxLength={191}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                aria-label="Email address"
                className="field"
                required
              />
              <button type="submit" disabled={state === "sending"} className="btn-navy shrink-0">
                {state === "sending" ? "Subscribing..." : "Subscribe"}
              </button>
            </form>
          )}
          {error ? <p className="mt-2 text-xs font-semibold text-signal-600">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
