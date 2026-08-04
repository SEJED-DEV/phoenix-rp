import { NextRequest, NextResponse } from "next/server";
import { getLogStats, searchLogs } from "@/lib/activity-log";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action") || undefined;
  const q = req.nextUrl.searchParams.get("q") || undefined;
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1", 10));
  const limit = Math.min(200, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "50", 10)));

  const { logs, total } = searchLogs({
    action: action || undefined,
    q: q || undefined,
    limit,
    offset: (page - 1) * limit,
  });
  const stats = getLogStats();

  return NextResponse.json({ logs, total, page, limit, stats });
}
