import { NextRequest, NextResponse } from "next/server";
import { searchMembers, getGuildRoles } from "@/lib/discord";

let roleNamesCache: { data: Record<string, string>; expiresAt: number } | null = null;

const QUERY_CACHE_TTL_MS = 30_000;
const queryCache = new Map<string, { data: unknown[]; expiresAt: number }>();

function pruneQueryCache() {
  if (queryCache.size < 200) return;
  const now = Date.now();
  for (const [k, v] of queryCache) {
    if (v.expiresAt <= now) queryCache.delete(k);
  }
}

async function getRoleNameMap(): Promise<Record<string, string>> {
  const now = Date.now();
  if (roleNamesCache && roleNamesCache.expiresAt > now) return roleNamesCache.data;

  const roles = await getGuildRoles();
  const map: Record<string, string> = {};
  for (const r of roles) {
    map[r.id] = r.name;
  }
  roleNamesCache = { data: map, expiresAt: now + 10 * 60 * 1000 };
  return map;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";

  if (q.trim().length < 2) {
    return NextResponse.json([]);
  }

  const cacheKey = q.trim().toLowerCase();

  const hit = queryCache.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) {
    return NextResponse.json(hit.data);
  }

  const [results, roleNames] = await Promise.all([searchMembers(cacheKey), getRoleNameMap()]);
  const enriched = results.map((m) => ({
    ...m,
    roleNames: m.roles.map((id) => roleNames[id] || null).filter(Boolean) as string[],
  }));
  pruneQueryCache();
  queryCache.set(cacheKey, { data: enriched, expiresAt: Date.now() + QUERY_CACHE_TTL_MS });
  return NextResponse.json(enriched);
}
