import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { ensureSessionRoles } from "@/lib/auth";
import { getTicketById, getAttachmentById, getInternalMessageIds } from "@/lib/tickets.db";
import { getTicketType, canViewTicketType } from "@/lib/tickets.config";
import { getAttachmentDiskPath } from "@/lib/ticket-uploads";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const session = await ensureSessionRoles();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, fileId } = await params;

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

  const attachment = getAttachmentById(fileId);
  if (!attachment || attachment.ticketId !== id) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }

  const isStaff = session.isStaff || false;
  if (attachment.messageId) {
    const internalMessageIds = getInternalMessageIds(id);
    if (internalMessageIds.has(attachment.messageId) && !isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const diskPath = getAttachmentDiskPath(id, attachment.storedName);
  if (!fs.existsSync(diskPath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const data = fs.readFileSync(diskPath);
  const isImage = attachment.mimeType.startsWith("image/");

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Length": String(data.length),
      "Cache-Control": "private, max-age=300",
      "Content-Disposition": isImage
        ? "inline"
        : `attachment; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`,
    },
  });
}
