import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getGuildMemberCount, getStaffCount } from "@/lib/discord";
import { countPendingApplications, countAllApplications } from "@/lib/applications.db";

export async function GET(req: NextRequest) {
  try {
    const roleLevel = req.headers.get("x-role-level") || "staff";
    const db = getDb();

    const totalMembers = await getGuildMemberCount();
    const staffTotal = await getStaffCount();

    const pendingApplications = countPendingApplications();

    const openTickets = db.prepare(
      "SELECT COUNT(*) as count FROM tickets WHERE status IN ('open', 'in-progress')"
    ).get() as { count: number };

    const actionsThisWeek = db.prepare(
      "SELECT COUNT(*) as count FROM staff_logs WHERE createdAt >= datetime('now', '-7 days')"
    ).get() as { count: number };

    const todayActions = db.prepare(
      "SELECT COUNT(*) as count FROM staff_logs WHERE createdAt >= datetime('now', 'start of day')"
    ).get() as { count: number };

    const recentLogs = db.prepare(
      "SELECT * FROM staff_logs ORDER BY id DESC LIMIT 15"
    ).all();

    const pendingByDept =
      roleLevel === "staff"
        ? []
        : countAllApplications()
            .filter((d) => d.pending > 0)
            .sort((a, b) => b.pending - a.pending)
            .map((d) => ({ slug: d.slug, label: d.label, pending: d.pending }));

    const recentTickets = db.prepare(
      "SELECT id, subject, username, priority, createdAt FROM tickets WHERE status IN ('open', 'in-progress') ORDER BY updatedAt DESC LIMIT 5"
    ).all() as { id: string; subject: string; username: string; priority: string; createdAt: string }[];

    const trendRows = db.prepare(
      `SELECT substr(createdAt, 1, 10) AS day, COUNT(*) AS c
       FROM staff_logs
       WHERE createdAt >= datetime('now', '-6 days', 'start of day')
       GROUP BY substr(createdAt, 1, 10)`
    ).all() as { day: string; c: number }[];

    const trendMap = new Map(trendRows.map((r) => [r.day, r.c]));
    const activityTrend: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      activityTrend.push({
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
        count: trendMap.get(key) ?? 0,
      });
    }

    return NextResponse.json({
      roleLevel,
      totalMembers,
      staffTotal,
      pendingApplications,
      openTickets: openTickets.count,
      actionsThisWeek: actionsThisWeek.count,
      todayActions: todayActions.count,
      activityTrend,
      pendingByDept,
      recentTickets,
      recentLogs,
    });
  } catch (e) {
    console.error("[dashboard] Error:", e);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
