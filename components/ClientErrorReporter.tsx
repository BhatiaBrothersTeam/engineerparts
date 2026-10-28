"use client";

import { useEffect } from "react";
import { logError } from "@/lib/logger";

/** Reports uncaught browser errors and unhandled promise rejections to the logger. */
export function ClientErrorReporter() {
  useEffect(() => {
    function onError(event: ErrorEvent) {
      // Cross-origin script errors arrive with no detail and cannot be acted on.
      if (!event.message || event.message === "Script error.") return;
      logError("client_unhandled_error", {
        message: event.message,
        file: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error,
        path: window.location.pathname,
      });
    }

    function onRejection(event: PromiseRejectionEvent) {
      logError("client_unhandled_rejection", {
        error: event.reason instanceof Error ? event.reason : String(event.reason),
        path: window.location.pathname,
      });
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
