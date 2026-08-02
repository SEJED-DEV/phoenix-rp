import { NextRequest, NextResponse } from "next/server";
import { ensureSessionRoles } from "@/lib/auth";
import {
  getTicketById,
  updateTicketStatus,
  updateTicketPriority,
  assignTicket,
  addTicketMessage,
  getTicketMessagesPaginated,
  type Ticket,
} from "@/lib/tickets.db";
import { getTicketType, canViewTicketType } from "@/lib/tickets.config";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await ensureSessionRoles();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ticket = getTicketById(id);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const isStaff = session.isStaff || false;

  if (!isStaff && ticket.userId !== session.userId) {
    const ticketType = getTicketType(ticket.type);
    const roles = session.roles || [];
    const canView = ticketType ? canViewTicketType(ticketType, roles) : false;
    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1", 10));
  const limit = 50;

  const { messages, total } = getTicketMessagesPaginated(id, page, limit, isStaff);

  return NextResponse.json({
    ticket,
    messages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await ensureSessionRoles();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isStaff = session.isStaff || false;
  if (!isStaff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status, priority, assignedTo, assignedToUsername } = body;

  const ticket = getTicketById(id);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  let updated = ticket;

  if (status) {
    if (!["open", "in-progress", "closed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updated = updateTicketStatus(id, status as Ticket["status"])!;
  }

  if (priority) {
    if (!["low", "medium", "high", "urgent"].includes(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }
    updated = updateTicketPriority(id, priority as Ticket["priority"])!;
  }

  if (assignedTo !== undefined) {
    updated = assignTicket(id, assignedTo || null, assignedToUsername || null)!;
    // Auto-set to in-progress when staff claims an open ticket
    if (assignedTo && updated.status === "open") {
      updated = updateTicketStatus(id, "in-progress")!;
    }
  }

  return NextResponse.json({ ticket: updated });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await ensureSessionRoles();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ticket = getTicketById(id);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const isStaff = session.isStaff || false;

  if (!isStaff && ticket.userId !== session.userId) {
    const ticketType = getTicketType(ticket.type);
    const roles = session.roles || [];
    const canView = ticketType ? canViewTicketType(ticketType, roles) : false;
    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (ticket.status === "closed") {
    return NextResponse.json({ error: "This ticket is closed." }, { status: 403 });
  }

  const body = await req.json();
  const { content, isInternal } = body;

  if (!content || !content.trim()) {
    return NextResponse.json({ error: "Message content is required" }, { status: 400 });
  }

  // Only staff can send internal notes
  const internal = isStaff && isInternal ? true : false;

  const message = addTicketMessage(
    id,
    session.userId,
    session.username,
    session.avatar,
    content.trim(),
    internal
  );

  // Auto-set to in-progress when staff replies on an open ticket
  let updatedTicket = ticket;
  if (isStaff && ticket.status === "open") {
    updatedTicket = updateTicketStatus(id, "in-progress")!;
  }

  return NextResponse.json({ message, ticket: updatedTicket }, { status: 201 });
}
