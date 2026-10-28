/**
 * Application logger, safe to import from server and client code.
 *
 * Development: every level is printed to the console in a readable format.
 * Production:
 *   - server: one JSON line per entry to stdout/stderr (host logs) and, once
 *     instrumentation.ts has installed the WordPress sink, persisted to the
 *     engineerparts_logs table in batches;
 *   - browser: warn/error entries are batched to /api/logs, which persists them
 *     through the server logger. Nothing is printed in the visitor's console.
 *
 * Logging never throws: a failing transport is dropped silently so it cannot
 * break the request or page that logged.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogContext = Record<string, unknown>;

export interface LogEntry {
  level: LogLevel;
  event: string;
  timestamp: string;
  source: "server" | "client";
  context: LogContext;
}

export type LogSink = (entry: LogEntry) => void;

const LEVEL_RANK: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const IS_BROWSER = typeof window !== "undefined";

// Server threshold comes from LOG_LEVEL (default: debug in development, info in
// production). The browser only ships warn/error so visitors cannot flood the store.
const MIN_LEVEL: LogLevel = IS_BROWSER
  ? IS_PRODUCTION ? "warn" : "debug"
  : parseLevel(process.env.LOG_LEVEL) ?? (IS_PRODUCTION ? "info" : "debug");

const SENSITIVE_KEY = /pass(word)?|secret|token|authori[sz]ation|cookie|session|api[-_]?key|card|cvv|cvc|iban|nonce/i;
const MAX_STRING = 2000;
const MAX_DEPTH = 4;

function parseLevel(value: string | undefined): LogLevel | null {
  const level = value?.trim().toLowerCase();
  return level === "debug" || level === "info" || level === "warn" || level === "error" ? level : null;
}

function serializeError(error: Error): LogContext {
  return {
    name: error.name,
    message: truncate(error.message),
    ...(error.stack ? { stack: truncate(error.stack) } : {}),
  };
}

function truncate(value: string): string {
  return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value;
}

/** Copies context into plain JSON, masking secret-looking keys and bounding size. */
function sanitize(value: unknown, depth = 0): unknown {
  if (value instanceof Error) return serializeError(value);
  if (value === null || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "string") return truncate(value);
  if (typeof value === "bigint") return value.toString();
  if (value === undefined || typeof value === "function" || typeof value === "symbol") return undefined;
  if (depth >= MAX_DEPTH) return "[truncated]";
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => sanitize(item, depth + 1));
  if (typeof value === "object") {
    const output: LogContext = {};
    for (const [key, item] of Object.entries(value as LogContext).slice(0, 50)) {
      output[key] = SENSITIVE_KEY.test(key) ? "[redacted]" : sanitize(item, depth + 1);
    }
    return output;
  }
  return String(value);
}

// ---------------------------------------------------------------------------
// Sinks. The persistent server sink lives on globalThis so the instance
// installed by instrumentation.ts is shared with every route bundle.

type LoggerGlobal = typeof globalThis & { __engineerpartsLogSink?: LogSink };

/** Installs the persistent sink (server only; called from instrumentation.ts). */
export function setLogSink(sink: LogSink | undefined): void {
  (globalThis as LoggerGlobal).__engineerpartsLogSink = sink;
}

const CONSOLE_METHOD: Record<LogLevel, "debug" | "info" | "warn" | "error"> = {
  debug: "debug",
  info: "info",
  warn: "warn",
  error: "error",
};

const ANSI: Record<LogLevel, string> = { debug: "\x1b[90m", info: "\x1b[36m", warn: "\x1b[33m", error: "\x1b[31m" };
const BROWSER_STYLE: Record<LogLevel, string> = {
  debug: "color:#6b7280",
  info: "color:#0891b2",
  warn: "color:#b45309;font-weight:600",
  error: "color:#dc2626;font-weight:600",
};

function printDevelopment(entry: LogEntry): void {
  const time = entry.timestamp.slice(11, 23);
  const label = entry.level.toUpperCase().padEnd(5);
  const hasContext = Object.keys(entry.context).length > 0;
  const method = console[CONSOLE_METHOD[entry.level]];
  if (IS_BROWSER) {
    method(`%c${label}%c ${entry.event}`, BROWSER_STYLE[entry.level], "color:inherit", ...(hasContext ? [entry.context] : []));
  } else {
    method(`\x1b[90m${time}\x1b[0m ${ANSI[entry.level]}${label}\x1b[0m ${entry.event}`, ...(hasContext ? [entry.context] : []));
  }
}

function printProduction(entry: LogEntry): void {
  console[CONSOLE_METHOD[entry.level]](JSON.stringify({ ...entry.context, level: entry.level, event: entry.event, timestamp: entry.timestamp }));
}

// Browser production transport: small batches posted to /api/logs.
const CLIENT_BATCH_MAX = 10;
const CLIENT_FLUSH_MS = 2000;
const CLIENT_SESSION_LIMIT = 50;
let clientQueue: LogEntry[] = [];
let clientTimer: ReturnType<typeof setTimeout> | undefined;
let clientSent = 0;

function flushClient(): void {
  if (clientTimer) clearTimeout(clientTimer);
  clientTimer = undefined;
  if (!clientQueue.length) return;
  const body = JSON.stringify({ entries: clientQueue });
  clientQueue = [];
  try {
    const sent = typeof navigator !== "undefined" && navigator.sendBeacon?.("/api/logs", new Blob([body], { type: "application/json" }));
    if (!sent) {
      void fetch("/api/logs", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  } catch {
    // Logging must never break the page.
  }
}

function queueClient(entry: LogEntry): void {
  if (clientSent >= CLIENT_SESSION_LIMIT) return;
  clientSent += 1;
  clientQueue.push(entry);
  if (clientQueue.length >= CLIENT_BATCH_MAX) flushClient();
  else if (!clientTimer) clientTimer = setTimeout(flushClient, CLIENT_FLUSH_MS);
}

if (IS_BROWSER && IS_PRODUCTION) {
  window.addEventListener("pagehide", flushClient);
}

// ---------------------------------------------------------------------------

function emit(level: LogLevel, event: string, context?: LogContext, source: LogEntry["source"] = IS_BROWSER ? "client" : "server"): void {
  if (LEVEL_RANK[level] < LEVEL_RANK[MIN_LEVEL]) return;
  try {
    const entry: LogEntry = {
      level,
      event: truncate(event).slice(0, 191),
      timestamp: new Date().toISOString(),
      source,
      context: (sanitize(context ?? {}) as LogContext) ?? {},
    };

    if (!IS_PRODUCTION) {
      printDevelopment(entry);
      return;
    }
    if (IS_BROWSER) {
      queueClient(entry);
      return;
    }
    printProduction(entry);
    (globalThis as LoggerGlobal).__engineerpartsLogSink?.(entry);
  } catch {
    // Logging must never break the caller.
  }
}

export const logger = {
  debug: (event: string, context?: LogContext) => emit("debug", event, context),
  info: (event: string, context?: LogContext) => emit("info", event, context),
  warn: (event: string, context?: LogContext) => emit("warn", event, context),
  error: (event: string, context?: LogContext) => emit("error", event, context),
};

export function logDebug(event: string, context?: LogContext): void {
  emit("debug", event, context);
}

export function logInfo(event: string, context?: LogContext): void {
  emit("info", event, context);
}

export function logWarn(event: string, context?: LogContext): void {
  emit("warn", event, context);
}

export function logError(event: string, context?: LogContext): void {
  emit("error", event, context);
}

/** Server use only: records an entry received from a browser via /api/logs. */
export function logClientEntry(level: LogLevel, event: string, context: LogContext): void {
  emit(level, event, context, "client");
}

export function redact(message: string): string {
  return message
    .replace(/https?:\/\/\S+/gi, "[redacted URL]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted email]")
    .replace(/\b\+?\d[\d\s().-]{7,}\d\b/g, "[redacted number]")
    .slice(0, 300);
}
