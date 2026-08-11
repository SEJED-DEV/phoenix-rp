import { getDb } from "./db";

/**
 * Mass DM broadcast.
 *
 * The owner composes a message in the staff panel. A dedicated worker
 * process (`broadcast-worker.ts`) picks up the queued job and DMs every
 * guild member over the Discord REST API, one at a time, strictly rate
 * limited. Once a broadcast is created, no new broadcast is allowed for
 * BROADCAST_LOCK_HOURS — regardless of whether it completed, was cancelled
 * or failed. The lock is intentionally brutal.
 */

export const BROADCAST_LOCK_HOURS = 24;

export const BROADCAST_DELAY_MS = (() => {
  const v = Number(process.env.BROADCAST_DELAY_MS || "1500");
  return Number.isFinite(v) && v >= 300 ? Math.floor(v) : 1500;
})();

export const BROADCAST_MAX_MESSAGE_LENGTH = 2000;

export type BroadcastStatus = "queued" | "running" | "completed" | "cancelled" | "failed";
export type RecipientStatus = "pending" | "sent" | "failed" | "blocked" | "skipped";

export interface BroadcastJob {
  id: number;
  message: string;
  status: BroadcastStatus;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  totalMembers: number;
  delayMs: number;
  lastError: string | null;
}

export interface BroadcastRecipient {
  id: number;
  jobId: number;
  userId: string;
  username: string;
  status: RecipientStatus;
  attempts: number;
  error: string | null;
  updatedAt: string | null;
}

export interface RecipientStats {
  total: number;
  pending: number;
  sent: number;
  failed: number;
  blocked: number;
  skipped: number;
}

export interface BroadcastLock {
  locked: boolean;
  reason: "active" | "cooldown" | null;
  lockedUntilIso: string | null;
  remainingMs: number;
  jobId: number | null;
}

/** SQLite `datetime('now')` strings are UTC without a timezone marker. */
export function parseSqliteDate(d: string | null): string | null {
  if (!d) return null;
  const iso = d.includes("T") || d.endsWith("Z") ? d : d.replace(" ", "T") + "Z";
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

function lockDeadlineFor(job: BroadcastJob): number {
  const t = Date.parse(parseSqliteDate(job.createdAt) ?? job.createdAt);
  return Number.isNaN(t) ? Date.now() : t + BROADCAST_LOCK_HOURS * 60 * 60 * 1000;
}

export function createBroadcastJob(opts: {
  message: string;
  createdBy: string;
  createdByName: string;
}): BroadcastJob {
  const db = getDb();
  const info = db
    .prepare(
      "INSERT INTO broadcast_jobs (message, createdBy, createdByName, delayMs) VALUES (?, ?, ?, ?)"
    )
    .run(opts.message, opts.createdBy, opts.createdByName, BROADCAST_DELAY_MS);
  return db.prepare("SELECT * FROM broadcast_jobs WHERE id = ?").get(info.lastInsertRowid) as BroadcastJob;
}

export function getBroadcastJob(id: number): BroadcastJob | null {
  const db = getDb();
  return (db.prepare("SELECT * FROM broadcast_jobs WHERE id = ?").get(id) as BroadcastJob | undefined) ?? null;
}

export function getLatestBroadcastJob(): BroadcastJob | null {
  const db = getDb();
  return (db.prepare("SELECT * FROM broadcast_jobs ORDER BY id DESC LIMIT 1").get() as BroadcastJob | undefined) ?? null;
}

export function getActiveBroadcastJob(): BroadcastJob | null {
  const db = getDb();
  return (
    (db
      .prepare("SELECT * FROM broadcast_jobs WHERE status IN ('queued', 'running') ORDER BY id LIMIT 1")
      .get() as BroadcastJob | undefined) ?? null
  );
}

export function getRecentBroadcastJobs(limit = 5): BroadcastJob[] {
  const db = getDb();
  return db.prepare("SELECT * FROM broadcast_jobs ORDER BY id DESC LIMIT ?").all(limit) as BroadcastJob[];
}

/**
 * The 24-hour lockdown. Once any broadcast exists, the server is locked
 * until 24h after that job was created. An active (queued/running) job also
 * locks immediately.
 */
export function getBroadcastLock(): BroadcastLock {
  const active = getActiveBroadcastJob();
  if (active) {
    const deadline = lockDeadlineFor(active);
    return {
      locked: true,
      reason: "active",
      lockedUntilIso: new Date(deadline).toISOString(),
      remainingMs: Math.max(0, deadline - Date.now()),
      jobId: active.id,
    };
  }

  const latest = getLatestBroadcastJob();
  if (!latest) {
    return { locked: false, reason: null, lockedUntilIso: null, remainingMs: 0, jobId: null };
  }

  const deadline = lockDeadlineFor(latest);
  const remaining = deadline - Date.now();
  if (remaining > 0) {
    return {
      locked: true,
      reason: "cooldown",
      lockedUntilIso: new Date(deadline).toISOString(),
      remainingMs: remaining,
      jobId: latest.id,
    };
  }

  return { locked: false, reason: null, lockedUntilIso: null, remainingMs: 0, jobId: null };
}

export function getRecipientStats(jobId: number): RecipientStats {
  const db = getDb();
  const rows = db
    .prepare("SELECT status, COUNT(*) AS c FROM broadcast_recipients WHERE jobId = ? GROUP BY status")
    .all(jobId) as { status: RecipientStatus; c: number }[];
  const stats: RecipientStats = { total: 0, pending: 0, sent: 0, failed: 0, blocked: 0, skipped: 0 };
  for (const r of rows) {
    stats.total += r.c;
    if (r.status === "pending") stats.pending = r.c;
    else if (r.status === "sent") stats.sent = r.c;
    else if (r.status === "failed") stats.failed = r.c;
    else if (r.status === "blocked") stats.blocked = r.c;
    else if (r.status === "skipped") stats.skipped = r.c;
  }
  return stats;
}

export function getRecipients(
  jobId: number,
  opts: { status?: string; limit?: number; offset?: number } = {}
): { rows: BroadcastRecipient[]; total: number } {
  const db = getDb();
  const limit = Math.min(200, Math.max(1, opts.limit ?? 50));
  const offset = Math.max(0, opts.offset ?? 0);

  const where: string[] = ["jobId = ?"];
  const params: unknown[] = [jobId];
  if (opts.status && opts.status !== "all") {
    where.push("status = ?");
    params.push(opts.status);
  }

  const total = (db.prepare(`SELECT COUNT(*) AS c FROM broadcast_recipients WHERE ${where.join(" AND ")}`).get(...params) as { c: number }).c;
  const rows = db
    .prepare(`SELECT * FROM broadcast_recipients WHERE ${where.join(" AND ")} ORDER BY id DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset) as BroadcastRecipient[];

  return { rows, total };
}

export function cancelBroadcastJob(jobId: number): boolean {
  const db = getDb();
  const job = getBroadcastJob(jobId);
  if (!job || (job.status !== "queued" && job.status !== "running")) return false;
  db.prepare("UPDATE broadcast_jobs SET status = 'cancelled' WHERE id = ?").run(jobId);
  return true;
}

export function markBroadcastJobFailed(jobId: number, error: string): void {
  const db = getDb();
  db.prepare("UPDATE broadcast_jobs SET status = 'failed', lastError = ?, completedAt = datetime('now') WHERE id = ?").run(error, jobId);
}
