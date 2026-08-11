import { NextRequest, NextResponse } from "next/server";
import { getGuildRoles } from "@/lib/discord";
import {
  SITE_CONFIG_SCOPES,
  addSiteConfigGrant,
  getAllSiteConfigGrants,
  isSiteConfigScope,
  removeSiteConfigGrant,
  type SiteConfigScope,
} from "@/lib/site-config-access";
import { isSiteAppearanceOwner } from "@/lib/site-appearance-access";
import { logStaffAction } from "@/lib/activity-log";

function denied() {
  return NextResponse.json({ error: "Only the site owner can manage site config access." }, { status: 403 });
}

async function assertOwner(req: NextRequest): Promise<string | null> {
  const userId = req.headers.get("x-user-id") || "";
  const owner = await isSiteAppearanceOwner(userId);
  if (!owner) return null;
  return userId;
}

export async function GET(req: NextRequest) {
  const userId = await assertOwner(req);
  if (!userId) return denied();

  const grants = getAllSiteConfigGrants();
  const guildRoles = await getGuildRoles();
  const roles = guildRoles
    .filter((r) => r.name)
    .sort((a, b) => b.position - a.position)
    .map((r) => ({ id: r.id, name: r.name }));

  return NextResponse.json({ grants, scopes: SITE_CONFIG_SCOPES, roles });
}

export async function POST(req: NextRequest) {
  const userId = await assertOwner(req);
  if (!userId) return denied();
  const username = req.headers.get("x-user-name") || "";

  let body: { scope?: unknown; granteeType?: unknown; granteeId?: unknown; granteeName?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const scope = String(body.scope ?? "");
  if (!isSiteConfigScope(scope)) {
    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  }
  const granteeType = String(body.granteeType ?? "");
  if (granteeType !== "member" && granteeType !== "role") {
    return NextResponse.json({ error: "Invalid grantee type" }, { status: 400 });
  }
  const granteeId = String(body.granteeId ?? "").trim();
  if (!granteeId) {
    return NextResponse.json({ error: "Missing grantee" }, { status: 400 });
  }

  addSiteConfigGrant({
    scope,
    granteeType,
    granteeId,
    granteeName: String(body.granteeName ?? "").trim() || granteeId,
    grantedBy: userId,
    grantedByUser: username,
  });

  logStaffAction({
    actorId: userId,
    actorName: username,
    action: "site_config_grant_add",
    targetId: granteeId,
    targetName: String(body.granteeName ?? "").trim() || granteeId,
    metadata: { scope, granteeType },
  });

  return NextResponse.json({ success: true, grants: getAllSiteConfigGrants() });
}

export async function DELETE(req: NextRequest) {
  const userId = await assertOwner(req);
  if (!userId) return denied();
  const username = req.headers.get("x-user-name") || "";

  const scope = req.nextUrl.searchParams.get("scope") ?? "";
  const granteeType = req.nextUrl.searchParams.get("type") ?? "";
  const granteeId = req.nextUrl.searchParams.get("id") ?? "";

  if (!isSiteConfigScope(scope)) {
    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  }
  if (granteeType !== "member" && granteeType !== "role") {
    return NextResponse.json({ error: "Invalid grantee type" }, { status: 400 });
  }
  if (!granteeId) {
    return NextResponse.json({ error: "Missing grantee" }, { status: 400 });
  }

  removeSiteConfigGrant(scope as SiteConfigScope, granteeType, granteeId);

  logStaffAction({
    actorId: userId,
    actorName: username,
    action: "site_config_grant_remove",
    targetId: granteeId,
    metadata: { scope, granteeType },
  });

  return NextResponse.json({ success: true, grants: getAllSiteConfigGrants() });
}
