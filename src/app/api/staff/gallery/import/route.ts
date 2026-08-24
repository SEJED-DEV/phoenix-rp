import { NextRequest, NextResponse } from "next/server";
import { getUserRolesFromHeaders } from "@/lib/permissions";
import { canEditSiteConfigScope } from "@/lib/site-config-access";
import { importFromDiscordMessage } from "@/lib/gallery-import";
import { logStaffAction } from "@/lib/activity-log";

async function isAllowed(req: NextRequest): Promise<boolean> {
  const userId = req.headers.get("x-user-id") || "";
  const roles = getUserRolesFromHeaders(req.headers);
  return canEditSiteConfigScope(userId, roles, "gallery");
}

export async function POST(req: NextRequest) {
  if (!(await isAllowed(req))) {
    return NextResponse.json({ error: "Only granted gallery editors can import from Discord" }, { status: 403 });
  }

  let body: { link?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const link = String(body.link ?? "").trim();
  if (!link) {
    return NextResponse.json({ error: "A Discord message link is required." }, { status: 400 });
  }

  const result = await importFromDiscordMessage(link);

  if (result.items.length === 0) {
    return NextResponse.json(
      { error: result.errors[0] || "Nothing could be imported from that message.", errors: result.errors },
      { status: 422 }
    );
  }

  logStaffAction({
    actorId: req.headers.get("x-user-id") || "",
    actorName: req.headers.get("x-user-name") || "",
    action: "gallery_update",
    reason: `Imported ${result.items.length} item(s) from Discord message`,
    metadata: {
      discordImport: true,
      imported: result.items.length,
      errors: result.errors,
    },
  });

  return NextResponse.json({
    items: result.items,
    errors: result.errors,
  });
}
