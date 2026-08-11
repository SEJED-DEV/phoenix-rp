import { NextRequest, NextResponse } from "next/server";
import {
  getBroadcastJob,
  getRecipients,
  getRecipientStats,
  parseSqliteDate,
} from "@/lib/broadcast";
import { isSiteAppearanceOwner } from "@/lib/site-appearance-access";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = req.headers.get("x-user-id") || "";
  const owner = await isSiteAppearanceOwner(userId);
  if (!owner) {
    return NextResponse.json({ error: "Only the site owner can view broadcast logs." }, { status: 403 });
  }

  const { id } = await params;
  const job = getBroadcastJob(Number(id));
  if (!job) {
    return NextResponse.json({ error: "Broadcast not found." }, { status: 404 });
  }

  const status = req.nextUrl.searchParams.get("status") || "all";
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1", 10));
  const limit = Math.min(200, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "50", 10)));

  const { rows, total } = getRecipients(job.id, { status, limit, offset: (page - 1) * limit });

  return NextResponse.json({
    job: {
      ...job,
      createdAtIso: parseSqliteDate(job.createdAt),
      startedAtIso: parseSqliteDate(job.startedAt),
      completedAtIso: parseSqliteDate(job.completedAt),
    },
    stats: getRecipientStats(job.id),
    recipients: rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      username: r.username,
      status: r.status,
      attempts: r.attempts,
      error: r.error,
      updatedAt: parseSqliteDate(r.updatedAt),
    })),
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
}
