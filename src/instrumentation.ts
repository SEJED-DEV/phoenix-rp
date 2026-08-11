// Next.js server instrumentation — runs once when the Node server starts.
// Hooks the global console so every server-side log line is queued for the
// Discord console relay (see src/lib/console-relay.ts). Guarded to the Node
// runtime only; Edge workers must not load better-sqlite3.

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { initConsoleRelay } = await import("@/lib/console-relay");
  initConsoleRelay("site");
}
