import { NextResponse } from "next/server";
import { ensureSessionRoles } from "@/lib/auth";
import { scanAndNotifyStaleTickets } from "@/lib/ticket-reminders";

export async function GET() {
  const session = await ensureSessionRoles();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.isStaff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await scanAndNotifyStaleTickets();
  return NextResponse.json(result);
}
