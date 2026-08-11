import { NextRequest, NextResponse } from "next/server";
import {
  BROADCAST_DELAY_MS,
  BROADCAST_MAX_MESSAGE_LENGTH,
  createBroadcastJob,
  getActiveBroadcastJob,
  getBroadcastLock,
  getRecentBroadcastJobs,
  getRecipients,
  getRecipientStats,
  parseSqliteDate,
} from "@/lib/broadcast";
import { isSiteAppearanceOwner } from "@/lib/site-appearance-access";
import { getGuildMemberCount } from "@/lib/discord";
import { logStaffAction } from "@/lib/activity-log";
import type { BroadcastJob } from "@/lib/broadcast";

export const dynamic = "force-dynamic";

async function assertOwner(req: NextRequest): Promise<string | null> {
  const userId = req.headers.get("x-user-id") || "";
  const owner = await isSiteAppearanceOwner(userId);
  return owner ? userId : null;
}

function serializeJob(job: BroadcastJob) {
  return {
    ...job,
    createdAtIso: parseSqliteDate(job.createdAt),
    startedAtIso: parseSqliteDate(job.startedAt),
    completedAtIso: parseSqliteDate(job.completedAt),
  };
}

function activeJobPayload() {
  const activeJob = getActiveBroadcastJob();
  if (!activeJob) return { activeJob: null, recipients: null };

  const stats = getRecipientStats(activeJob.id);
  const pending = stats.pending > 0 ? stats.pending : Math.max(0, activeJob.totalMembers - stats.total);
  const etaSeconds = Math.ceil((pending * BROADCAST_DELAY_MS) / 1000);

  const { rows } = getRecipients(activeJob.id, { limit: 100 });
  return {
    activeJob: {
      job: serializeJob(activeJob),
      stats,
      pendingRemaining: pending,
      etaSeconds,
    },
    recipients: rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      username: r.username,
      status: r.status,
      attempts: r.attempts,
      error: r.error,
      updatedAt: parseSqliteDate(r.updatedAt),
    })),
  };
}

export async function GET(req: NextRequest) {
  const userId = await assertOwner(req);
  if (!userId) {
    return NextResponse.json({ error: "Only the site owner can access mass DMs." }, { status: 403 });
  }

  const lock = getBroadcastLock();
  const recentJobs = getRecentBroadcastJobs(5).map((j) => ({
    ...serializeJob(j),
    stats: getRecipientStats(j.id),
  }));

  let memberCount: number | null = null;
  try {
    memberCount = await getGuildMemberCount();
  } catch {
    memberCount = null;
  }

  return NextResponse.json({
    delayMs: BROADCAST_DELAY_MS,
    maxMessageLength: BROADCAST_MAX_MESSAGE_LENGTH,
    memberCount,
    lock,
    recentJobs,
    ...activeJobPayload(),
  });
}

export async function POST(req: NextRequest) {
  const userId = await assertOwner(req);
  if (!userId) {
    return NextResponse.json({ error: "Only the site owner can start mass DMs." }, { status: 403 });
  }
  const username = req.headers.get("x-user-name") || "";

  let body: { message?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = String(body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }
  if (message.length > BROADCAST_MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message too long (${message.length}/${BROADCAST_MAX_MESSAGE_LENGTH} characters).` },
      { status: 400 }
    );
  }

  const lock = getBroadcastLock();
  if (lock.locked) {
    return NextResponse.json(
      { error: "A mass DM is locked. No new broadcast is allowed until the current 24-hour window ends.", lock },
      { status: 409 }
    );
  }

  const job = createBroadcastJob({ message, createdBy: userId, createdByName: username || userId });

  logStaffAction({
    actorId: userId,
    actorName: username || userId,
    action: "broadcast_dm_start",
    targetId: String(job.id),
    targetName: "Everyone",
    reason: "Mass DM to every guild member queued",
    metadata: {
      messageLength: message.length,
      delayMs: BROADCAST_DELAY_MS,
      lockHours: 24,
    },
  });

  const stats = getRecipientStats(job.id);
  return NextResponse.json(
    {
      success: true,
      job: serializeJob(job),
      stats,
      lock: getBroadcastLock(),
      ...activeJobPayload(),
    },
    { status: 201 }
  );
}
