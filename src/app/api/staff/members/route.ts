import { NextRequest, NextResponse } from "next/server";
import { searchMembers, getGuildRoles } from "@/lib/discord";

let roleNamesCache: { data: Record<string, string>; expiresAt: number } | null = null;

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

  if (q.length < 2) {
    return NextResponse.json([]);
  }

  const [results, roleNames] = await Promise.all([searchMembers(q), getRoleNameMap()]);
  const enriched = results.map((m) => ({
    ...m,
    roleNames: m.roles.map((id) => roleNames[id] || null).filter(Boolean) as string[],
  }));
  return NextResponse.json(enriched);
}
