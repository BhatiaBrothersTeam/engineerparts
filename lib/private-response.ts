import "server-only";

import { NextResponse } from "next/server";

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
} as const;

export function privateJson(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: PRIVATE_HEADERS });
}
