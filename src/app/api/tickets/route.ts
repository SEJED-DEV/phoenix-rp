import { NextRequest, NextResponse } from "next/server";
import { ensureSessionRoles } from "@/lib/auth";
import { createTicket, getTicketsByUser, getAllTickets, getArchivedTickets, hasOpenTicketOfType, logTicketActivity, type TicketAttachment } from "@/lib/tickets.db";
import { getTicketType, getAvailableTicketTypes, canViewTicketType, canAccessTicketArchive, TICKET_DELETE_POLICY } from "@/lib/tickets.config";
import { sendTicketNotification } from "@/lib/tickets.webhook";
import { getHighestRole } from "@/lib/discord";
import { getSiteUrl } from "@/lib/site-url";
import { validateUploadFiles, saveTicketAttachments, type UploadFile } from "@/lib/ticket-uploads";

function getUploadedFiles(form: FormData): UploadFile[] {
  return (form.getAll("files") || []).filter((f): f is File => typeof f !== "string");
}

export async function GET(req: NextRequest) {
  const session = await ensureSessionRoles();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isStaff = session.isStaff || false;
  const roles = session.roles || [];
  const availableTypes = getAvailableTicketTypes(roles);

  const showArchived = req.nextUrl.searchParams.get("archived") === "1";

  let tickets;
  if (showArchived) {
    if (!isStaff || !canAccessTicketArchive(roles)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    tickets = getArchivedTickets().filter((t) => {
      const ticketType = getTicketType(t.type);
      return t.userId === session.userId || (ticketType ? canViewTicketType(ticketType, roles) : false);
    });
  } else {
    const allTickets = isStaff ? getAllTickets() : getTicketsByUser(session.userId);
    tickets = allTickets.filter((t) => {
      const ticketType = getTicketType(t.type);
      return t.userId === session.userId || (ticketType ? canViewTicketType(ticketType, roles) : false);
    });
  }

  return NextResponse.json({
    tickets,
    isStaff,
    availableTypes,
    deletePolicy: TICKET_DELETE_POLICY,
    canViewArchive: isStaff && canAccessTicketArchive(roles),
  });
}

export async function POST(req: NextRequest) {
  const session = await ensureSessionRoles();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const type = String(form.get("type") || "");
  const subject = String(form.get("subject") || "");
  const description = String(form.get("description") || "");

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

  const files = getUploadedFiles(form);
  const fileError = validateUploadFiles(files);
  if (fileError) {
    return NextResponse.json({ error: fileError }, { status: 400 });
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

  const typeName = getTicketType(type)?.name || type;
  logTicketActivity(ticket.id, `Ticket opened as **${typeName}** by @${session.username}`);

  let attachments: TicketAttachment[] = [];
  if (files.length > 0) {
    const result = await saveTicketAttachments(ticket.id, session.userId, session.username, files, null);
    attachments = result.attachments;
  }

  const ticketUrl = `${getSiteUrl()}/tickets?id=${ticket.id}`;

  sendTicketNotification(ticket, ticketUrl);

  return NextResponse.json({ ticket, attachments }, { status: 201 });
}
