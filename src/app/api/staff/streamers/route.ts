import { NextRequest, NextResponse } from "next/server";
import { getStreamers, upsertStreamers } from "@/lib/streamers.db";
import { canEditStreamersFromHeaders } from "@/lib/streamers-access";
import { logStaffAction } from "@/lib/activity-log";

const VALID_PLATFORMS = ["twitch", "youtube", "kick", "tiktok"];

export async function GET(req: NextRequest) {
  if (!(await canEditStreamersFromHeaders(req.headers))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const streamers = getStreamers();
    return NextResponse.json({ streamers });
  } catch (e) {
    console.error("[streamers] GET error:", e);
    return NextResponse.json({ error: "Failed to load streamers" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await canEditStreamersFromHeaders(req.headers))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { streamers?: { id?: string; platform?: string; username?: string; displayName?: string; avatarUrl?: string; channelUrl?: string; socialLinks?: { platform: string; url: string }[] }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.streamers)) {
    return NextResponse.json({ error: "streamers array is required" }, { status: 400 });
  }

  const sanitized = body.streamers
    .filter((it) => it.username && typeof it.username === "string")
    .map((it) => ({
      id: it.id || crypto.randomUUID(),
      platform: VALID_PLATFORMS.includes(it.platform || "") ? it.platform! : "twitch",
      username: String(it.username).trim().slice(0, 100),
      displayName: String(it.displayName || "").trim().slice(0, 100),
      avatarUrl: String(it.avatarUrl || "").trim().slice(0, 500),
      channelUrl: String(it.channelUrl || "").trim().slice(0, 500),
      socialLinks: Array.isArray(it.socialLinks)
        ? it.socialLinks
            .filter((s) => s.url && typeof s.url === "string")
            .map((s) => ({
              platform: String(s.platform || "").trim().slice(0, 50),
              url: String(s.url).trim().slice(0, 500),
            }))
            .slice(0, 10)
        : [],
    }));

  upsertStreamers(sanitized);

  const actorId = req.headers.get("x-user-id") || "";
  const actorName = req.headers.get("x-user-name") || "Unknown";
  logStaffAction({
    actorId,
    actorName,
    action: "streamers_update",
    metadata: { count: sanitized.length },
  });

  return NextResponse.json({ success: true });
}
