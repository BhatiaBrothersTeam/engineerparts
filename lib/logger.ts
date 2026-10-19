type LogContext = Record<string, unknown>;

function serializeError(error: unknown): unknown {
  return error instanceof Error ? { name: error.name, message: error.message } : error;
}

function emit(level: "error" | "warn" | "info", event: string, context?: LogContext): void {
  const record = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...context,
    ...(context?.error !== undefined ? { error: serializeError(context.error) } : {}),
  };
  const line = JSON.stringify(record);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export function logError(event: string, context?: LogContext): void {
  emit("error", event, context);
}

export function logWarn(event: string, context?: LogContext): void {
  emit("warn", event, context);
}

export function logInfo(event: string, context?: LogContext): void {
  emit("info", event, context);
}

export function redact(message: string): string {
  return message
    .replace(/https?:\/\/\S+/gi, "[redacted URL]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted email]")
    .replace(/\b\+?\d[\d\s().-]{7,}\d\b/g, "[redacted number]")
    .slice(0, 300);
}
