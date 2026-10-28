"use client";

import Link from "next/link";
import { useEffect } from "react";
import { logError } from "@/lib/logger";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logError("page.render_failed", { error, digest: error.digest });
  }, [error]);

  return (
    <section role="alert" className="container-page py-12">
      <div className="card mx-auto max-w-xl space-y-4 p-6">
        <h1 className="text-h2 text-navy-950">This page could not be loaded</h1>
        <p className="text-sm text-steel-700">Check your connection and try again. If the problem continues, contact support and tell us which page you were opening.</p>
        <p className="text-sm text-steel-700">If you just submitted an order or payment, check its status before submitting again to avoid duplicates.</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={reset}>Try again</button>
          <Link href="/contact" className="btn-outline">Contact support</Link>
        </div>
      </div>
    </section>
  );
}
