import { getDb } from "./db";

export type StaffAction =
  | "member_kick"
  | "member_ban"
  | "member_unban"
  | "role_change"
  | "punish"
  | "unpunish"
  | "application_approve"
  | "application_deny"
  | "ticket_assign"
  | "ticket_close"
  | "announcement_create"
  | "announcement_delete"
  | "note_create"
  | "note_delete"
  | "config_update"
  | "login"
  | "app_config_editor_add"
  | "app_config_editor_remove"
  | "application_questions_update";

interface LogEntry {
  actorId: string;
  actorName: string;
  action: StaffAction;
  targetId?: string;
  targetName?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export function logStaffAction(entry: LogEntry): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO staff_logs (actorId, actorName, action, targetId, targetName, reason, metadata, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(
    entry.actorId,
    entry.actorName,
    entry.action,
    entry.targetId ?? null,
    entry.targetName ?? null,
    entry.reason ?? null,
    entry.metadata ? JSON.stringify(entry.metadata) : null,
  );
}

export interface LogRow {
  id: number;
  actorId: string;
  actorName: string;
  action: string;
  targetId: string | null;
  targetName: string | null;
  reason: string | null;
  metadata: string | null;
  createdAt: string;
}

export function getLogs(opts: { limit?: number; offset?: number; action?: string } = {}): LogRow[] {
  const db = getDb();
  const { limit = 50, offset = 0, action } = opts;

  if (action) {
    return db.prepare(
      "SELECT * FROM staff_logs WHERE action = ? ORDER BY id DESC LIMIT ? OFFSET ?"
    ).all(action, limit, offset) as LogRow[];
  }

  return db.prepare(
    "SELECT * FROM staff_logs ORDER BY id DESC LIMIT ? OFFSET ?"
  ).all(limit, offset) as LogRow[];
}

export function getLogCount(action?: string): number {
  const db = getDb();
  if (action) {
    const row = db.prepare("SELECT COUNT(*) as count FROM staff_logs WHERE action = ?").get(action) as { count: number };
    return row.count;
  }
  const row = db.prepare("SELECT COUNT(*) as count FROM staff_logs").get() as { count: number };
  return row.count;
}

export function searchLogs(opts: { action?: string; q?: string; limit?: number; offset?: number } = {}): {
  logs: LogRow[];
  total: number;
} {
  const db = getDb();
  const where: string[] = [];
  const params: unknown[] = [];

  if (opts.action) {
    where.push("action = ?");
    params.push(opts.action);
  }
  if (opts.q && opts.q.trim()) {
    where.push("(actorName LIKE ? OR targetName LIKE ? OR reason LIKE ? OR metadata LIKE ?)");
    const like = `%${opts.q.trim()}%`;
    params.push(like, like, like, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const limit = Math.max(1, Math.min(opts.limit ?? 50, 200));
  const offset = Math.max(0, opts.offset ?? 0);

  const total = (
    db.prepare(`SELECT COUNT(*) as c FROM staff_logs ${whereSql}`).get(...params) as { c: number }
  ).c;

  const logs = db
    .prepare(`SELECT * FROM staff_logs ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset) as LogRow[];

  return { logs, total };
}

export function getLogStats(): { total: number; thisWeek: number; byAction: Record<string, number> } {
  const db = getDb();
  const total = (db.prepare("SELECT COUNT(*) as c FROM staff_logs").get() as { c: number }).c;
  const thisWeek = (
    db
      .prepare("SELECT COUNT(*) as c FROM staff_logs WHERE createdAt >= datetime('now', '-7 days')")
      .get() as { c: number }
  ).c;
  const rows = db
    .prepare("SELECT action, COUNT(*) as c FROM staff_logs GROUP BY action ORDER BY c DESC")
    .all() as { action: string; c: number }[];
  const byAction: Record<string, number> = {};
  for (const r of rows) byAction[r.action] = r.c;
  return { total, thisWeek, byAction };
}
