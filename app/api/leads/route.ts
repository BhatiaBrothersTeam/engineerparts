import { NextRequest, NextResponse } from "next/server";
import { wordpressAccountRequest } from "@/lib/auth-server";
import { SESSION_COOKIE } from "@/lib/account";
import type { Lead } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface EnquiryResponse {
  ok: boolean;
  error?: string;
  lead_id?: string;
  received_at?: string;
  admin_email_sent?: boolean;
}

function validLead(value: unknown): value is Partial<Lead> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const lead = value as Partial<Lead>;
  const requiresBusinessContact = ["general_contact", "product_enquiry", "whole_lot_enquiry", "equipment_enquiry"].includes(lead.lead_type ?? "");
  return Boolean(
    lead.lead_type &&
      lead.contact?.trim() &&
      lead.email?.trim() &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email) &&
      (!requiresBusinessContact || (lead.company?.trim() && lead.phone?.trim())) &&
      (lead.lead_type !== "general_contact" || lead.message?.trim()) &&
      (!lead.message || lead.message.length <= 5000),
  );
}

export async function POST(request: NextRequest) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return NextResponse.json({ ok: false, error: "Invalid request origin." }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 32_768) return NextResponse.json({ ok: false, error: "Request is too large." }, { status: 413 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 }); }
  if (!validLead(payload)) return NextResponse.json({ ok: false, error: "Please complete the required fields, including a valid email and phone number for contact or listing enquiries." }, { status: 422 });
  const result = await wordpressAccountRequest<EnquiryResponse>("enquiries", {
    method: "POST", body: payload, token: request.cookies.get(SESSION_COOKIE)?.value,
    clientIp: (request.headers.get("x-forwarded-for")?.split(",")[0] ?? request.ip ?? "unknown").trim(),
  });
  return NextResponse.json(result.data.ok ? { ok: true, lead_id: result.data.lead_id, received_at: result.data.received_at, admin_email_sent: result.data.admin_email_sent } : { ok: false, error: result.data.error || "Unable to submit your enquiry." }, { status: result.status });
}

export async function GET() {
  return NextResponse.json({ ok: false, error: "Use the authenticated account enquiries endpoint." }, { status: 405, headers: { Allow: "POST" } });
}
