import { NextRequest, NextResponse } from "next/server";
import { ensureSessionRoles } from "@/lib/auth";
import { getTicketById, restoreTicket } from "@/lib/tickets.db";
import { canAccessTicketArchive } from "@/lib/tickets.config";
import { logStaffAction } from "@/lib/activity-log";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await ensureSessionRoles();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roles = session.roles || [];
  if (!canAccessTicketArchive(roles)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const ticket = getTicketById(id);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  if (!ticket.archivedAt) {
    return NextResponse.json({ error: "This ticket is not archived." }, { status: 400 });
  }

  const restored = restoreTicket(id);
  if (!restored) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  logStaffAction({
    actorId: session.userId,
    actorName: session.username,
    action: "ticket_restore",
    targetId: ticket.id,
    targetName: ticket.subject,
    metadata: {
      userId: ticket.userId,
      username: ticket.username,
      type: ticket.type,
    },
  });

  return NextResponse.json({ ok: true, ticket: restored });
}
