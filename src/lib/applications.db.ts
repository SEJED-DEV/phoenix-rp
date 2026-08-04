import { getDb } from "./db";
import { getApplyConfig, APPLICATION_SLUGS, ON_SITE_APPLICATIONS } from "./apply.config";

export interface ApplicationRow {
  id: number;
  discordId: string;
  username: string;
  formData: string;
  status: string;
  reviewerId: string | null;
  reviewerName: string | null;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

function getTable(slug: string): string {
  const config = getApplyConfig(slug);
  if (!config) throw new Error(`Unknown application type: ${slug}`);
  return config.table;
}

function validateSlug(slug: string): void {
  if (!APPLICATION_SLUGS.includes(slug)) {
    throw new Error(`Unknown application type: ${slug}`);
  }
}

export function createApplication(slug: string, discordId: string, username: string, formData: Record<string, unknown>): number {
  validateSlug(slug);
  const table = getTable(slug);
  const db = getDb();
  const result = db.prepare(`INSERT INTO ${table} (discordId, username, formData) VALUES (?, ?, ?)`).run(
    discordId,
    username,
    JSON.stringify(formData),
  );
  return result.lastInsertRowid as number;
}

export function hasPendingApplication(slug: string, discordId: string): boolean {
  validateSlug(slug);
  const table = getTable(slug);
  const db = getDb();
  const row = db.prepare(`SELECT 1 FROM ${table} WHERE discordId = ? AND status = 'pending' LIMIT 1`).get(discordId);
  return !!row;
}

export function getApplications(slug: string, opts: { status?: string; page?: number; limit?: number; q?: string } = {}): { applications: ApplicationRow[]; total: number } {
  validateSlug(slug);
  const table = getTable(slug);
  const db = getDb();
  const { status, page = 1, limit = 20, q } = opts;
  const offset = (page - 1) * limit;

  const clauses: string[] = [];
  const params: unknown[] = [];
  if (status) {
    clauses.push("status = ?");
    params.push(status);
  }
  if (q) {
    clauses.push("username LIKE ?");
    params.push(`%${q}%`);
  }
  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";

  const countRow = db.prepare(`SELECT COUNT(*) as count FROM ${table} ${where}`).get(...params) as { count: number };
  const applications = db.prepare(`SELECT * FROM ${table} ${where} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as ApplicationRow[];

  return { applications, total: countRow.count };
}

export function getApplicationById(slug: string, id: number): ApplicationRow | null {
  validateSlug(slug);
  const table = getTable(slug);
  const db = getDb();
  const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id) as ApplicationRow | undefined;
  return row ?? null;
}

export function updateApplication(slug: string, id: number, update: { status: string; reviewerId: string; reviewerName: string; reviewNote?: string }): boolean {
  validateSlug(slug);
  const table = getTable(slug);
  const db = getDb();
  const result = db.prepare(`UPDATE ${table} SET status = ?, reviewerId = ?, reviewerName = ?, reviewNote = ?, reviewedAt = datetime('now') WHERE id = ?`).run(
    update.status,
    update.reviewerId,
    update.reviewerName,
    update.reviewNote ?? null,
    id,
  );
  return result.changes > 0;
}

export function countApplicationsByStatus(slug: string): { pending: number; approved: number; denied: number } {
  validateSlug(slug);
  const table = getTable(slug);
  const db = getDb();
  const rows = db.prepare(`SELECT status, COUNT(*) as count FROM ${table} GROUP BY status`).all() as { status: string; count: number }[];
  const counts = { pending: 0, approved: 0, denied: 0 };
  for (const row of rows) {
    if (row.status in counts) {
      counts[row.status as keyof typeof counts] = row.count;
    }
  }
  return counts;
}

export function countPendingApplications(): number {
  const db = getDb();
  let total = 0;
  for (const slug of ON_SITE_APPLICATIONS) {
    const row = db.prepare(
      `SELECT COUNT(*) AS c FROM ${getTable(slug)} WHERE status = 'pending'`
    ).get() as { c: number };
    total += row.c;
  }
  return total;
}

export function countAllApplications(): { slug: string; label: string; pending: number; approved: number; denied: number; total: number }[] {
  const db = getDb();
  return ON_SITE_APPLICATIONS.map((slug) => {
    const table = getTable(slug);
    const rows = db.prepare(`SELECT status, COUNT(*) as count FROM ${table} GROUP BY status`).all() as { status: string; count: number }[];
    const counts = { pending: 0, approved: 0, denied: 0 };
    for (const row of rows) {
      if (row.status in counts) {
        counts[row.status as keyof typeof counts] = row.count;
      }
    }
    const total = (db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number }).count;
    const config = getApplyConfig(slug)!;
    return { slug, label: config.label, pending: counts.pending, approved: counts.approved, denied: counts.denied, total };
  });
}
