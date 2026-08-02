import { NextResponse } from "next/server";
import { ensureSessionRoles } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { logStaffAction } from "@/lib/activity-log";
import { addRole } from "@/lib/discord";
import { ROLES } from "@/lib/discord";

export async function POST() {
  const session = await ensureSessionRoles();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.roles.includes(ROLES.WHITELISTED) && !session.roles.includes(ROLES.CHECKIN)) {
    const result = await addRole(session.userId, ROLES.CHECKIN);
    if (!result) {
      return NextResponse.json({ error: "Failed to check in — Discord API error" }, { status: 500 });
    }
  }

  logStaffAction({
    actorId: session.userId,
    actorName: session.username,
    action: "role_change",
    targetId: session.userId,
    targetName: session.username,
    reason: "Self check-in",
    metadata: { roleAdded: ROLES.CHECKIN },
  });

  return NextResponse.json({ success: true });
}
