import "server-only";

import type { LogEntry, LogSink } from "@/lib/logger";

/**
 * Persists production log entries to WordPress (engineerparts/v1/logs, stored in the
 * engineerparts_logs table by the account plugin). Entries are buffered and sent in
 * batches so a burst of logs costs one request, not one per line.
 *
 * Failures are reported to stderr only — never through the logger — so a WordPress
 * outage cannot cause a logging loop. Entries that cannot be delivered are dropped
 * once the buffer is full; the JSON line already written to the host logs remains.
 */

const BATCH_SIZE = 25;
const FLUSH_INTERVAL_MS = 3000;
const MAX_BUFFER = 500;
const REQUEST_TIMEOUT_MS = 5000;

export function createWordPressLogSink(): LogSink | undefined {
  const wordpressUrl = (process.env.WORDPRESS_URL || process.env.WOOCOMMERCE_URL)?.replace(/\/$/, "");
  const proxySecret = process.env.ENGINEERPARTS_PROXY_SECRET;
  if (!wordpressUrl || !proxySecret) {
    console.warn(JSON.stringify({ level: "warn", event: "log_store_disabled", reason: "WORDPRESS_URL or ENGINEERPARTS_PROXY_SECRET is not set" }));
    return undefined;
  }

  const endpoint = `${wordpressUrl}/wp-json/engineerparts/v1/logs`;
  let buffer: LogEntry[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;
  let sending = false;
  let dropped = 0;

  async function flush(): Promise<void> {
    if (timer) clearTimeout(timer);
    timer = undefined;
    if (sending || !buffer.length) return;

    sending = true;
    const batch = buffer.slice(0, BATCH_SIZE);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-EngineerParts-Proxy-Secret": proxySecret!,
        },
        body: JSON.stringify({ entries: batch, dropped }),
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (response.ok) {
        buffer = buffer.slice(batch.length);
        dropped = 0;
      } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        // Rejected payload (bad request, auth, missing route): retrying will not help.
        buffer = buffer.slice(batch.length);
        console.error(JSON.stringify({ level: "error", event: "log_store_rejected", status: response.status }));
      }
    } catch (error) {
      console.error(JSON.stringify({
        level: "error",
        event: "log_store_unavailable",
        reason: error instanceof Error ? error.name : "unknown",
      }));
    } finally {
      sending = false;
    }

    if (buffer.length) schedule(FLUSH_INTERVAL_MS);
  }

  function schedule(delay: number): void {
    if (timer) return;
    timer = setTimeout(() => void flush(), delay);
    // Do not keep the process alive just to ship logs.
    (timer as { unref?: () => void }).unref?.();
  }

  return (entry) => {
    if (buffer.length >= MAX_BUFFER) {
      dropped += 1;
      return;
    }
    buffer.push(entry);
    if (entry.level === "error" || buffer.length >= BATCH_SIZE) void flush();
    else schedule(FLUSH_INTERVAL_MS);
  };
}
