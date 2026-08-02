import { NextRequest, NextResponse } from "next/server";
import { ensureSessionRoles } from "@/lib/auth";
import { createTicket, getTicketsByUser, getAllTickets, hasOpenTicketOfType } from "@/lib/tickets.db";
import { getTicketType } from "@/lib/tickets.config";
import { sendTicketNotification } from "@/lib/tickets.webhook";
import { getHighestRole } from "@/lib/discord";

export async function GET(_req: NextRequest) {
  const session = await ensureSessionRoles();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isStaff = session.isStaff || false;
  console.log("[tickets] GET session:", session.userId, "isStaff:", isStaff, "roles:", session.roles);

  if (isStaff) {
    const tickets = getAllTickets();
    return NextResponse.json({ tickets, isStaff: true });
  }

  const roles = session.roles || [];
  const tickets = getTicketsByUser(session.userId);
  return NextResponse.json({ tickets, isStaff: false });
}

export async function POST(req: NextRequest) {
  const session = await ensureSessionRoles();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { type, subject, description } = body;

  if (!type || !subject || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const ticketType = getTicketType(type);
  if (!ticketType) {
    return NextResponse.json({ error: "Invalid ticket type" }, { status: 400 });
  }

  const roles = session.roles || [];

  if (ticketType.openRoles.length > 0) {
    const hasAccess = ticketType.openRoles.some((r) => roles.includes(r));
    if (!hasAccess) {
      return NextResponse.json({ error: "You don't have access to this ticket type" }, { status: 403 });
    }
  }

  if (hasOpenTicketOfType(session.userId, type)) {
    return NextResponse.json({ error: "You already have an open ticket of this type. Close it before opening a new one." }, { status: 409 });
  }

  const ticket = createTicket({
    userId: session.userId,
    username: session.username,
    avatar: session.avatar || "",
    type,
    subject,
    description,
    userRole: getHighestRole(session.roles) || undefined,
  });

  const ticketUrl = `${req.nextUrl.origin}/tickets?id=${ticket.id}`;

  sendTicketNotification(ticket, ticketUrl);

  return NextResponse.json({ ticket }, { status: 201 });
}
