import { NextRequest, NextResponse } from "next/server";
import {
  cancelBroadcastJob,
  getBroadcastJob,
  getBroadcastLock,
} from "@/lib/broadcast";
import { isSiteAppearanceOwner } from "@/lib/site-appearance-access";
import { logStaffAction } from "@/lib/activity-log";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = req.headers.get("x-user-id") || "";
  const username = req.headers.get("x-user-name") || "";
  const owner = await isSiteAppearanceOwner(userId);
  if (!owner) {
    return NextResponse.json({ error: "Only the site owner can cancel a broadcast." }, { status: 403 });
  }

  const { id } = await params;
  const job = getBroadcastJob(Number(id));
  if (!job) {
    return NextResponse.json({ error: "Broadcast not found." }, { status: 404 });
  }

  const cancelled = cancelBroadcastJob(job.id);
  if (!cancelled) {
    return NextResponse.json(
      { error: "This broadcast can no longer be cancelled (already completed, failed or cancelled)." },
      { status: 409 }
    );
  }

  logStaffAction({
    actorId: userId,
    actorName: username || userId,
    action: "broadcast_dm_cancel",
    targetId: String(job.id),
    targetName: "Everyone",
    reason: "Mass DM cancelled before reaching every member",
    metadata: { messageLength: job.message.length },
  });

  return NextResponse.json({ success: true, lock: getBroadcastLock() });
}
