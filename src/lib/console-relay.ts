// Console relay — captures every `console.*` call in the current process and
// queues it in the shared SQLite DB (`console_entries`) so the relay-worker
// process can forward it to Discord as Message Components v2 containers.
//
// One instance per process: the site (via src/instrumentation.ts), the bot
// (bot.ts), and the tunnel wrapper (tunnel.ts) each call initConsoleRelay()
// once with their own source label. The relay worker is a separate process.
//
// This module is Node-only. It must never be imported from Edge runtime code
// (better-sqlite3 is unavailable there).

import { getDb } from "./db";

type RelaySource = "site" | "bot" | "tunnel";
type RelayLevel = "log" | "info" | "warn" | "error";

export type ConsoleEntry = {
  id: number;
  source: string;
  level: RelayLevel;
  content: string;
  status: "pending" | "sent" | "failed";
  createdAt: string;
};

const ACTIVE_SOURCES = new Set<RelaySource>();

// Drop lines matching this regex (case-insensitive). Configured via
// CONSOLE_RELAY_FILTER. Anything matching is never queued.
let filterRe: RegExp | null = null;
try {
  const f = process.env.CONSOLE_RELAY_FILTER;
  if (f) filterRe = new RegExp(f, "i");
} catch {
  filterRe = null;
}

function shouldRelay(content: string): boolean {
  return filterRe ? !filterRe.test(content) : true;
}

function formatArg(arg: unknown): string {
  if (typeof arg === "string") return arg;
  if (arg instanceof Error) return arg.stack || arg.message;
  if (arg && typeof arg === "object") {
    try {
      const s = JSON.stringify(arg);
      return s === undefined ? String(arg) : s;
    } catch {
      return String(arg);
    }
  }
  return String(arg);
}

export function enqueueConsoleEntry(
  source: RelaySource,
  level: RelayLevel,
  content: string
): void {
  if (!content || !shouldRelay(content)) return;
  try {
    getDb()
      .prepare("INSERT INTO console_entries (source, level, content) VALUES (?, ?, ?)")
      .run(source, level, content);
  } catch {
    // The relay must never take the app down — drop the entry.
  }
}

export function enqueueConsoleEntries(
  source: RelaySource,
  entries: { level: RelayLevel; content: string }[]
): void {
  if (entries.length === 0) return;
  try {
    const insert = getDb().prepare(
      "INSERT INTO console_entries (source, level, content) VALUES (?, ?, ?)"
    );
    const tx = getDb().transaction((rows: { level: RelayLevel; content: string }[]) => {
      for (const row of rows) {
        const trimmed = row.content.replace(/\r?\n$/, "");
        if (trimmed && shouldRelay(trimmed)) insert.run(source, row.level, trimmed);
      }
    });
    tx(entries);
  } catch {
    // Best-effort — never let capture break the caller.
  }
}

/**
 * Patches console.log/info/warn/error once per process. Each call is inserted
 * into the queue and then passed through to the real console implementation so
 * terminal / pm2 logs keep working exactly as before.
 */
export function initConsoleRelay(source: RelaySource): void {
  if (ACTIVE_SOURCES.has(source)) return;
  ACTIVE_SOURCES.add(source);

  const real = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
  };

  const make =
    (level: RelayLevel) =>
    (...args: unknown[]): void => {
      const content = args.map(formatArg).join(" ");
      enqueueConsoleEntry(source, level, content);
      real[level](...args);
    };

  console.log = make("log");
  console.info = make("info");
  console.warn = make("warn");
  console.error = make("error");
}
