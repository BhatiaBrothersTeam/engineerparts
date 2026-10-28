import { NextRequest } from "next/server";
import { wordpressAccountRequest } from "@/lib/auth-server";
import { SESSION_COOKIE, type AuthResponse } from "@/lib/account";
import { privateJson } from "@/lib/private-response";

const POST_ACTIONS = new Set([
  "register",
  "login",
  "logout",
  "verify-email",
  "resend-verification",
  "forgot-password",
  "reset-password",
]);

function sameOrigin(request: NextRequest): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function clientIp(request: NextRequest): string {
  return request.ip?.trim() || "unknown";
}

function responseBody(data: AuthResponse & { token?: string; expiresAt?: string }, status: number) {
  return privateJson(data.ok ? {
    ok: true,
    message: data.message,
    customer: data.customer,
    requiresVerification: data.requiresVerification,
  } : {
    ok: false,
    error: data.error || "Unable to complete this request.",
    code: data.code,
  }, status);
}

function invalidPayload(action: string, value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "Invalid request.";
  const body = value as Record<string, unknown>;
  const text = (key: string, max: number) => typeof body[key] === "string" && body[key].trim().length > 0 && body[key].trim().length <= max;
  const email = text("email", 254) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email));
  if (action === "logout") return null;
  if (action === "login") return email && text("password", 256) ? null : "Enter a valid email address and password.";
  if (action === "forgot-password" || action === "resend-verification") return email ? null : "Enter a valid email address.";
  if (action === "verify-email") return email && text("token", 128) ? null : "Invalid verification request.";
  if (action === "reset-password") return text("login", 60) && text("key", 128) && text("password", 256) ? null : "Invalid password reset request.";
  if (action === "register") {
    const required = text("firstName", 60) && text("lastName", 60) && email && text("phone", 40) && text("company", 120) && text("password", 256);
    const captcha = text("captchaToken", 4096);
    const optional = ["jobTitle", "department", "companyWebsite", "country", "vatNumber", "customerType"]
      .every((key) => body[key] === undefined || (typeof body[key] === "string" && body[key].length <= 200));
    return required && captcha && optional ? null : "Unable to create your account. Please check the information and try again.";
  }
  return "Invalid request.";
}

export async function GET(request: NextRequest, { params }: { params: { action: string } }) {
  if (params.action !== "me") {
    return privateJson({ ok: false, error: "Not found." }, 404);
  }
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return privateJson({ authenticated: false, customer: null });
  }
  const result = await wordpressAccountRequest("auth/me", { token });
  if (result.status !== 200 || !result.data.customer) {
    const response = privateJson({ authenticated: false, customer: null }, 401);
    if (result.status === 401) {
      response.cookies.delete(SESSION_COOKIE);
    }
    return response;
  }
  return privateJson({ authenticated: true, customer: result.data.customer });
}

export async function POST(request: NextRequest, { params }: { params: { action: string } }) {
  if (!POST_ACTIONS.has(params.action)) {
    return privateJson({ ok: false, error: "Not found." }, 404);
  }
  if (!sameOrigin(request)) {
    return privateJson({ ok: false, error: "Invalid request origin." }, 403);
  }
  if (Number(request.headers.get("content-length") ?? 0) > 32_768) {
    return privateJson({ ok: false, error: "Request is too large." }, 413);
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    return privateJson({ ok: false, error: "Invalid request." }, 400);
  }
  const validationError = invalidPayload(params.action, body);
  if (validationError) {
    return privateJson({ ok: false, error: validationError }, 422);
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const result = await wordpressAccountRequest(`auth/${params.action}`, {
    method: "POST",
    body,
    token,
    clientIp: clientIp(request),
  });
  if (params.action === "login" && result.status === 200) {
    const expiresAt = result.data.expiresAt ? Date.parse(result.data.expiresAt) : Number.NaN;
    if (!result.data.token || !/^[a-f0-9]{64}$/i.test(result.data.token) || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      return privateJson({ ok: false, error: "Account service returned an invalid session." }, 502);
    }
    const response = responseBody(result.data, result.status);
    const maxAge = Math.floor((expiresAt - Date.now()) / 1000);
    response.cookies.set(SESSION_COOKIE, result.data.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge,
    });
    return response;
  }
  const response = responseBody(result.data, result.status);
  if (params.action === "logout" && result.data.ok) {
    response.cookies.delete(SESSION_COOKIE);
  }
  return response;
}