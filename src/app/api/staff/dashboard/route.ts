import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getGuildMemberCount, getStaffWithPresence } from "@/lib/discord";

export async function GET() {
  try {
    const db = getDb();

    const totalMembers = await getGuildMemberCount();
    const staff = await getStaffWithPresence();
    const staffOnline = staff.filter((s) => s.online).length;

    const pendingApps = db.prepare(
      "SELECT COUNT(*) as count FROM applications WHERE status = 'pending'"
    ).get() as { count: number };

    const openTickets = db.prepare(
      "SELECT COUNT(*) as count FROM tickets WHERE status = 'open'"
    ).get() as { count: number };

    const actionsThisWeek = db.prepare(
      "SELECT COUNT(*) as count FROM staff_logs WHERE createdAt >= datetime('now', '-7 days')"
    ).get() as { count: number };

    const recentLogs = db.prepare(
      "SELECT * FROM staff_logs ORDER BY id DESC LIMIT 15"
    ).all();

    return NextResponse.json({
      totalMembers,
      staffTotal: staff.length,
      staffOnline,
      pendingApplications: pendingApps.count,
      openTickets: openTickets.count,
      actionsThisWeek: actionsThisWeek.count,
      recentLogs,
    });
  } catch (e) {
    console.error("[dashboard] Error:", e);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
