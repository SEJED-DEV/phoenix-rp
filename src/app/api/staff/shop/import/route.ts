import { NextRequest, NextResponse } from "next/server";
import { getUserRolesFromHeaders } from "@/lib/permissions";
import { canEditSiteConfigScope } from "@/lib/site-config-access";
import { getShopSettings, importForumItems, updateShopSettings } from "@/lib/shop.config";
import { logStaffAction } from "@/lib/activity-log";

async function isAllowed(req: NextRequest): Promise<boolean> {
  const userId = req.headers.get("x-user-id") || "";
  const roles = getUserRolesFromHeaders(req.headers);
  return canEditSiteConfigScope(userId, roles, "content");
}

export async function POST(req: NextRequest) {
  if (!(await isAllowed(req))) {
    return NextResponse.json({ error: "Only the site owner or granted editors can import shop items" }, { status: 403 });
  }

  let body: { forumChannel?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const forumChannel = String(body.forumChannel ?? "").trim();
  if (!forumChannel) {
    return NextResponse.json({ error: "A Discord forum channel ID is required." }, { status: 400 });
  }

  const username = req.headers.get("x-user-name") || "";
  const userId = req.headers.get("x-user-id") || "";

  const result = await importForumItems(forumChannel);

  const settings = getShopSettings();
  if (settings.forumChannel !== forumChannel) {
    updateShopSettings({ ...settings, forumChannel });
  }

  logStaffAction({
    actorId: userId,
    actorName: username,
    action: "shop_update",
    reason: `Imported ${result.imported} item(s) from Discord forum`,
    metadata: {
      imported: result.imported,
      errors: result.errors,
      forumChannel,
    },
  });

  return NextResponse.json({
    imported: result.imported,
    items: result.items,
    settings: getShopSettings(),
    errors: result.errors,
  });
}
