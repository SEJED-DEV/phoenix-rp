import { NextRequest, NextResponse } from "next/server";
import { ensureSessionRoles } from "@/lib/auth";
import {
  getTicketById,
  updateTicketStatus,
  updateTicketPriority,
  assignTicket,
  addTicketMessage,
  getTicketMessagesPaginated,
  getTicketAttachments,
  getInternalMessageIds,
  type Ticket,
  type TicketAttachment,
} from "@/lib/tickets.db";
import { getTicketType, canViewTicketType } from "@/lib/tickets.config";
import { validateUploadFiles, saveTicketAttachments, type UploadFile } from "@/lib/ticket-uploads";

function getUploadedFiles(form: FormData): UploadFile[] {
  return (form.getAll("files") || []).filter((f): f is File => typeof f !== "string");
}

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
  const roles = session.roles || [];

  const ticketType = getTicketType(ticket.type);
  const canView =
    ticket.userId === session.userId || (ticketType ? canViewTicketType(ticketType, roles) : false);
  if (!canView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1", 10));
  const limit = 50;

  const { messages, total } = getTicketMessagesPaginated(id, page, limit, isStaff);

  const internalMessageIds = getInternalMessageIds(id);
  const attachments = getTicketAttachments(id).filter((a) => {
    if (isStaff) return true;
    if (!a.messageId) return true;
    return !internalMessageIds.has(a.messageId);
  });

  return NextResponse.json({
    ticket,
    messages,
    attachments,
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

  const roles = session.roles || [];
  const ticketType = getTicketType(ticket.type);
  const canView =
    ticket.userId === session.userId || (ticketType ? canViewTicketType(ticketType, roles) : false);
  if (!canView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  const roles = session.roles || [];
  const ticketType = getTicketType(ticket.type);
  const canView =
    ticket.userId === session.userId || (ticketType ? canViewTicketType(ticketType, roles) : false);
  if (!canView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (ticket.status === "closed") {
    return NextResponse.json({ error: "This ticket is closed." }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const content = String(form.get("content") || "").trim();
  const isInternal = form.get("isInternal") === "true";
  const files = getUploadedFiles(form);

  if (!content && files.length === 0) {
    return NextResponse.json({ error: "Message content is required" }, { status: 400 });
  }

  const fileError = validateUploadFiles(files);
  if (fileError) {
    return NextResponse.json({ error: fileError }, { status: 400 });
  }

  // Only staff can send internal notes
  const internal = isStaff && isInternal ? true : false;

  const message = addTicketMessage(
    id,
    session.userId,
    session.username,
    session.avatar,
    content || "",
    internal
  );

  let attachments: TicketAttachment[] = [];
  if (files.length > 0) {
    const result = await saveTicketAttachments(id, session.userId, session.username, files, message.id);
    attachments = result.attachments;
  }

  // Auto-set to in-progress when staff replies on an open ticket
  let updatedTicket = ticket;
  if (isStaff && ticket.status === "open") {
    updatedTicket = updateTicketStatus(id, "in-progress")!;
  }

  return NextResponse.json({ message, ticket: updatedTicket, attachments }, { status: 201 });
}
