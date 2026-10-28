/**
 * Runs once when the Next.js server starts. In production on the Node.js runtime it
 * installs the database log sink, so every server-side logger call is also stored in
 * WordPress. Development keeps console-only logging.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "production") return;
  if (process.env.LOG_TO_DATABASE === "false") return;

  const [{ setLogSink }, { createWordPressLogSink }] = await Promise.all([
    import("@/lib/logger"),
    import("@/lib/log-store"),
  ]);
  setLogSink(createWordPressLogSink());
}
