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
  | "login";

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
