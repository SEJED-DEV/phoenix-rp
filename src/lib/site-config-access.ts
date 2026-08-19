import { getDb } from "./db";
import { isSiteAppearanceOwner } from "./site-appearance-access";

export const SITE_CONFIG_SCOPES = ["site", "links", "content", "gallery"] as const;
export type SiteConfigScope = (typeof SITE_CONFIG_SCOPES)[number];

export interface SiteConfigGrant {
  scope: SiteConfigScope;
  granteeType: "member" | "role";
  granteeId: string;
  granteeName: string;
  grantedBy: string;
  grantedByUser: string;
  grantedAt: string;
}

export function isSiteConfigScope(value: string): value is SiteConfigScope {
  return (SITE_CONFIG_SCOPES as readonly string[]).includes(value);
}

export function getAllSiteConfigGrants(): SiteConfigGrant[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM site_config_grants ORDER BY scope, grantedAt DESC")
    .all() as SiteConfigGrant[];
}

export function getGrantsForScope(scope: SiteConfigScope): SiteConfigGrant[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM site_config_grants WHERE scope = ? ORDER BY grantedAt DESC")
    .all(scope) as SiteConfigGrant[];
}

export function addSiteConfigGrant(opts: {
  scope: SiteConfigScope;
  granteeType: "member" | "role";
  granteeId: string;
  granteeName: string;
  grantedBy: string;
  grantedByUser: string;
}): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO site_config_grants (scope, granteeType, granteeId, granteeName, grantedBy, grantedByUser, grantedAt)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(scope, granteeType, granteeId) DO UPDATE SET
      granteeName = excluded.granteeName,
      grantedBy = excluded.grantedBy,
      grantedByUser = excluded.grantedByUser,
      grantedAt = excluded.grantedAt
  `).run(
    opts.scope,
    opts.granteeType,
    opts.granteeId,
    opts.granteeName,
    opts.grantedBy,
    opts.grantedByUser,
  );
}

export function removeSiteConfigGrant(scope: SiteConfigScope, granteeType: string, granteeId: string): void {
  const db = getDb();
  db.prepare(
    "DELETE FROM site_config_grants WHERE scope = ? AND granteeType = ? AND granteeId = ?"
  ).run(scope, granteeType, granteeId);
}

export function canEditSiteScope(userId: string, userRoles: string[], scope: SiteConfigScope): boolean {
  if (!userId) return false;
  const grants = getGrantsForScope(scope);
  return grants.some((g) =>
    g.granteeType === "member" ? g.granteeId === userId : userRoles.includes(g.granteeId)
  );
}

export async function getSiteConfigScopesForUser(userId: string, userRoles: string[]): Promise<SiteConfigScope[]> {
  const isOwner = await isSiteAppearanceOwner(userId);
  if (isOwner) return [...SITE_CONFIG_SCOPES];
  return SITE_CONFIG_SCOPES.filter((scope) => canEditSiteScope(userId, userRoles, scope));
}

export async function canEditSiteConfigScope(
  userId: string,
  userRoles: string[],
  scope: SiteConfigScope
): Promise<boolean> {
  if (!userId) return false;
  if (await isSiteAppearanceOwner(userId)) return true;
  return canEditSiteScope(userId, userRoles, scope);
}
