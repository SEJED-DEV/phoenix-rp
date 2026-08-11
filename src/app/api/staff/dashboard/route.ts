import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getGuildMemberCount, getStaffCount } from "@/lib/discord";
import { countPendingApplications, countAllApplications } from "@/lib/applications.db";
import { getRoleLevel, getUserRolesFromHeaders } from "@/lib/permissions";
import {
  canEditQuestions,
  getViewableDepts,
  isHighRank,
} from "@/lib/application-questions";
import { ON_SITE_APPLICATIONS } from "@/lib/apply.config";
import { isSiteAppearanceOwner } from "@/lib/site-appearance-access";

export async function GET(req: NextRequest) {
  try {
    const roleLevel = getRoleLevel(req.headers);
    const userId = req.headers.get("x-user-id") || "";
    const roles = getUserRolesFromHeaders(req.headers);
    const isAdmin = isHighRank(roleLevel);
    const isSiteOwner = await isSiteAppearanceOwner(userId);

    const viewable = isAdmin
      ? ON_SITE_APPLICATIONS
      : getViewableDepts(userId, roles, ON_SITE_APPLICATIONS);
    const canReviewApplications = isAdmin || viewable.length > 0;
    const canEditQuestionsFlag =
      isAdmin || ON_SITE_APPLICATIONS.some((slug) => canEditQuestions(userId, roles, slug));

    const db = getDb();

    const totalMembers = await getGuildMemberCount();
    const staffTotal = await getStaffCount();

    const allCounts = countAllApplications();
    const scopedCounts = isAdmin ? allCounts : allCounts.filter((d) => viewable.includes(d.slug));
    const pendingApplications = isAdmin
      ? countPendingApplications()
      : scopedCounts.reduce((sum, d) => sum + d.pending, 0);

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
      canReviewApplications
        ? scopedCounts
            .filter((d) => d.pending > 0)
            .sort((a, b) => b.pending - a.pending)
            .map((d) => ({ slug: d.slug, label: d.label, pending: d.pending }))
        : [];

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
      canReviewApplications,
      canEditQuestions: canEditQuestionsFlag,
      isSiteOwner,
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
