import { getDb } from "./db";

export interface DepartedMember {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  punishmentRoles: { id: string; name: string; severity: number }[];
  allRoles: string[];
  leftAt: string;
  rejoined: boolean;
}

export function getDepartedMembers(search?: string, limit = 50, offset = 0): DepartedMember[] {
  const db = getDb();
  let rows: Record<string, unknown>[];

  if (search && search.length >= 2) {
    const q = `%${search.toLowerCase()}%`;
    rows = db.prepare(`
      SELECT * FROM departed_members
      WHERE LOWER(username) LIKE ? OR LOWER(displayName) LIKE ? OR userId LIKE ?
      ORDER BY leftAt DESC
      LIMIT ? OFFSET ?
    `).all(q, q, q, limit, offset) as Record<string, unknown>[];
  } else {
    rows = db.prepare(`
      SELECT * FROM departed_members
      ORDER BY leftAt DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset) as Record<string, unknown>[];
  }

  return rows.map((r) => ({
    id: r.id as string,
    userId: r.userId as string,
    username: r.username as string,
    displayName: r.displayName as string,
    avatar: r.avatar as string,
    punishmentRoles: (() => { try { return JSON.parse(r.punishmentRoles as string); } catch { return []; } })(),
    allRoles: (() => { try { return JSON.parse(r.allRoles as string); } catch { return []; } })(),
    leftAt: r.leftAt as string,
    rejoined: (r.rejoined as number) === 1,
  }));
}

export function getDepartedMemberCount(search?: string): number {
  const db = getDb();
  if (search && search.length >= 2) {
    const q = `%${search.toLowerCase()}%`;
    const row = db.prepare(`
      SELECT COUNT(*) as count FROM departed_members
      WHERE LOWER(username) LIKE ? OR LOWER(displayName) LIKE ? OR userId LIKE ?
    `).get(q, q, q) as { count: number };
    return row.count;
  }
  const row = db.prepare("SELECT COUNT(*) as count FROM departed_members").get() as { count: number };
  return row.count;
}

export function getDepartedMemberByUserId(userId: string): DepartedMember | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM departed_members WHERE userId = ? ORDER BY leftAt DESC LIMIT 1").get(userId) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: row.id as string,
    userId: row.userId as string,
    username: row.username as string,
    displayName: row.displayName as string,
    avatar: row.avatar as string,
    punishmentRoles: (() => { try { return JSON.parse(row.punishmentRoles as string); } catch { return []; } })(),
    allRoles: (() => { try { return JSON.parse(row.allRoles as string); } catch { return []; } })(),
    leftAt: row.leftAt as string,
    rejoined: (row.rejoined as number) === 1,
  };
}
