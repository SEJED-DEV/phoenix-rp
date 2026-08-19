import { NextRequest, NextResponse } from "next/server";
import { ensureSessionRoles } from "@/lib/auth";
import {
  getTicketById,
  updateTicketStatus,
  updateTicketPriority,
  updateTicketType,
  assignTicket,
  addTicketMessage,
  getTicketMessagesPaginated,
  getTicketMessagesForStaff,
  getTicketAttachments,
  getInternalMessageIds,
  archiveTicket,
  type Ticket,
  type TicketAttachment,
} from "@/lib/tickets.db";
import {
  getTicketType,
  canViewTicketType,
  canDeleteTicket,
  canAccessTicketArchive,
  TICKET_DELETE_POLICY,
} from "@/lib/tickets.config";
import { validateUploadFiles, saveTicketAttachments, type UploadFile } from "@/lib/ticket-uploads";
import { logStaffAction } from "@/lib/activity-log";

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

  if (ticket.archivedAt && !canAccessTicketArchive(roles)) {
    return NextResponse.json({ error: "Archived tickets are restricted to authorized staff." }, { status: 403 });
  }

  const ticketType = getTicketType(ticket.type);
  const canView =
    ticket.userId === session.userId || (ticketType ? canViewTicketType(ticketType, roles) : false);
  if (!canView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1", 10));
  const limit = 50;

  const transcript = req.nextUrl.searchParams.get("transcript") === "1";
  if (transcript) {
    const allMessages = getTicketMessagesForStaff(id);
    const allAttachments = getTicketAttachments(id);
    return NextResponse.json({
      ticket,
      messages: allMessages,
      attachments: allAttachments,
      transcript: true,
    });
  }

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
    deletePolicy: TICKET_DELETE_POLICY,
    isArchived: !!ticket.archivedAt,
    canViewArchive: canAccessTicketArchive(roles),
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
  const { status, priority, type, assignedTo, assignedToUsername } = body;

  const ticket = getTicketById(id);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  if (ticket.archivedAt) {
    return NextResponse.json({ error: "Archived tickets cannot be edited. Restore it first." }, { status: 403 });
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

  if (type) {
    const validTypes = ["general", "ban-appeal", "complaint", "bug-report", "refund", "high-rank", "partnership", "donation"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid ticket type" }, { status: 400 });
    }
    updated = updateTicketType(id, type)!;
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

  if (ticket.archivedAt) {
    return NextResponse.json({ error: "This ticket is archived and read-only. Restore it to reply." }, { status: 403 });
  }

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

export async function DELETE(
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

  if (ticket.archivedAt && !canAccessTicketArchive(roles)) {
    return NextResponse.json({ error: "This ticket is already archived." }, { status: 400 });
  }

  const ticketType = getTicketType(ticket.type);
  const canView =
    ticket.userId === session.userId || (ticketType ? canViewTicketType(ticketType, roles) : false);
  if (!canView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!canDeleteTicket(isStaff, session.userId, ticket)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let reason = "";
  try {
    const body = (await req.json()) as { reason?: unknown };
    if (typeof body?.reason === "string") reason = body.reason.trim();
  } catch {
    reason = "";
  }

  const archived = archiveTicket(id);
  if (!archived) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  if (isStaff) {
    logStaffAction({
      actorId: session.userId,
      actorName: session.username,
      action: "ticket_archive",
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
  }

  return NextResponse.json({ ok: true });
}
