import "server-only";

/**
 * Small in-memory fixed-window limiter, shared per server process.
 * It is a first line of defence for anonymous endpoints; for multi-instance deployments also
 * enforce limits at the edge (CDN/WAF), because each instance keeps its own counters.
 */
type Bucket = { count: number; resetAt: number };
const MAX_BUCKETS = 10_000;
const stores = globalThis as unknown as { __epRateLimits?: Map<string, Map<string, Bucket>> };

export function rateLimit(scope: string, key: string, limit: number, windowMs: number, cost = 1): boolean {
  const all = (stores.__epRateLimits ??= new Map());
  let buckets = all.get(scope);
  if (!buckets) all.set(scope, (buckets = new Map()));
  const now = Date.now();
  const current = buckets.get(key);
  if (current && current.resetAt > now) {
    current.count += cost;
    return current.count <= limit;
  }
  if (buckets.size >= MAX_BUCKETS) {
    for (const [bucketKey, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(bucketKey);
    if (buckets.size >= MAX_BUCKETS) {
      const oldest = buckets.keys().next().value as string | undefined;
      if (oldest !== undefined) buckets.delete(oldest);
    }
  }
  buckets.set(key, { count: cost, resetAt: now + windowMs });
  return cost <= limit;
}

/** Reads at most `maxBytes` from a request body, so a missing/false Content-Length cannot bypass size caps. */
export async function readLimitedText(request: Request, maxBytes: number): Promise<string | null> {
  if (Number(request.headers.get("content-length") ?? 0) > maxBytes) return null;
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}
