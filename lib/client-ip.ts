import "server-only";

import { headers as nextHeaders } from "next/headers";

/**
 * Resolves the caller's IP for rate limiting.
 *
 * `x-forwarded-for` and similar headers are attacker-controlled unless a trusted reverse proxy
 * overwrites them, so they are ignored unless the operator opts in:
 *   TRUSTED_PROXY_IP_HEADER  header set by YOUR proxy/CDN, e.g. "x-forwarded-for", "x-real-ip", "cf-connecting-ip"
 *   TRUSTED_PROXY_HOPS       number of trusted proxies that append to x-forwarded-for (default 1)
 * With x-forwarded-for the entry that the trusted proxy appended (counted from the right) is used,
 * never the left-most value, which the client controls.
 */
function parseIp(value: string | null | undefined): string | null {
  const candidate = value?.trim();
  if (!candidate || candidate.length > 64) return null;
  return /^[0-9a-fA-F:.]+$/.test(candidate) ? candidate : null;
}

export function resolveClientIp(headers: Headers, platformIp?: string | null): string {
  const headerName = process.env.TRUSTED_PROXY_IP_HEADER?.trim().toLowerCase();
  if (headerName) {
    const raw = headers.get(headerName);
    if (raw) {
      if (headerName === "x-forwarded-for") {
        const hops = Math.max(1, Number.parseInt(process.env.TRUSTED_PROXY_HOPS ?? "1", 10) || 1);
        const parts = raw.split(",").map((part) => part.trim()).filter(Boolean);
        const ip = parseIp(parts[parts.length - hops]);
        if (ip) return ip;
      } else {
        const ip = parseIp(raw.split(",")[0]);
        if (ip) return ip;
      }
    }
  }
  return parseIp(platformIp) ?? "unknown";
}

/** For server components and library code that run inside a request. */
export function currentClientIp(): string {
  try {
    return resolveClientIp(nextHeaders());
  } catch {
    return "unknown";
  }
}
