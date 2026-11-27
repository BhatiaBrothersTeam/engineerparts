import { NextResponse } from "next/server";
import { resolveClientIp } from "@/lib/client-ip";
import { rateLimit, readLimitedText } from "@/lib/rate-limit";
import { logError } from "@/lib/logger";
import { getWooCommerceCartQuote } from "@/lib/woocommerce";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface QuotePayload {
  country: string;
  items: Array<{ productId: string; quantity: number }>;
}

function validPayload(value: unknown): value is QuotePayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<QuotePayload>;
  return Boolean(
    /^[A-Z]{2}$/.test(payload.country ?? "") &&
      payload.items?.length &&
      payload.items.length <= 50 &&
      payload.items.every(
        (item) =>
          Number.isInteger(Number(item.productId)) &&
          Number(item.productId) > 0 &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0,
      ),
  );
}

export async function POST(request: Request) {
  // Each call fans out to many WooCommerce requests, so cap per-IP volume and body size.
  if (!rateLimit("cart-totals", resolveClientIp(request.headers), 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    const rawBody = await readLimitedText(request, 16_384);
    if (rawBody === null) return NextResponse.json({ error: "Request is too large" }, { status: 413 });
    const payload: unknown = JSON.parse(rawBody);
    if (!validPayload(payload)) {
      return NextResponse.json({ error: "Invalid cart details" }, { status: 400 });
    }
    return NextResponse.json(await getWooCommerceCartQuote(payload.items, payload.country));
  } catch (error) {
    logError("cart_totals_failed", { endpoint: "/api/cart/totals", error });
    return NextResponse.json({ error: "Unable to calculate WooCommerce totals" }, { status: 502 });
  }
}