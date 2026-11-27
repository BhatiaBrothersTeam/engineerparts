import { NextRequest, NextResponse } from "next/server";
import { wordpressAccountRequest } from "@/lib/auth-server";
import { resolveClientIp } from "@/lib/client-ip";
import { rateLimit, readLimitedText } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SubscriptionResponse {
  ok: boolean;
  error?: string;
}

export async function POST(request: NextRequest) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403 });
  }
  const clientIp = resolveClientIp(request.headers, request.ip);
  if (!rateLimit("clearance-alerts", clientIp, 10, 60 * 60_000)) {
    return NextResponse.json({ ok: false, error: "Too many requests. Please try again later." }, { status: 429 });
  }
  const rawBody = await readLimitedText(request, 4096);
  if (rawBody === null) {
    return NextResponse.json({ ok: false, error: "Request is too large." }, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    typeof (payload as { email?: unknown }).email !== "string" ||
    (payload as { email: string }).email.trim().length > 191 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((payload as { email: string }).email.trim())
  ) {
    return NextResponse.json({ ok: false, error: "Please enter a valid email address." }, { status: 422 });
  }

  const email = (payload as { email: string }).email.trim().toLowerCase();
  const result = await wordpressAccountRequest<SubscriptionResponse>("clearance-alerts", {
    method: "POST",
    body: { email },
    clientIp,
  });
  return NextResponse.json(
    result.data.ok ? { ok: true } : { ok: false, error: result.data.error || "Unable to save your email." },
    { status: result.status },
  );
}

export async function GET() {
  return NextResponse.json({ ok: false, error: "Use POST to register an email address." }, { status: 405, headers: { Allow: "POST" } });
}
