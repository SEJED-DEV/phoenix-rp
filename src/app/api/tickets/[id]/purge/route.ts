import { NextRequest, NextResponse } from "next/server";
import { ensureSessionRoles } from "@/lib/auth";
import { getTicketById, deleteTicket } from "@/lib/tickets.db";
import { canAccessTicketArchive } from "@/lib/tickets.config";
import { deleteTicketFiles } from "@/lib/ticket-uploads";
import { logStaffAction } from "@/lib/activity-log";

export async function DELETE(
  req: NextRequest,
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

  let reason = "";
  try {
    const body = (await req.json()) as { reason?: unknown };
    if (typeof body?.reason === "string") reason = body.reason.trim();
  } catch {
    reason = "";
  }

  const result = deleteTicket(id);
  if (!result) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  deleteTicketFiles(id);

  logStaffAction({
    actorId: session.userId,
    actorName: session.username,
    action: "ticket_purge",
    targetId: ticket.id,
    targetName: ticket.subject,
    reason: reason || undefined,
    metadata: {
      userId: ticket.userId,
      username: ticket.username,
      type: ticket.type,
      priority: ticket.priority,
    },
  });

  return NextResponse.json({ ok: true });
}
