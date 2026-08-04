import { NextRequest, NextResponse } from "next/server";
import { ensureSessionRoles } from "@/lib/auth";
import { getTicketById } from "@/lib/tickets.db";
import { getTicketType, canViewTicketType } from "@/lib/tickets.config";
import { openDm, sendMessage } from "@/lib/discord";
import { getSiteUrl } from "@/lib/site-url";

// Where the reminder lands if the user has DMs closed.
const FALLBACK_CHANNEL = process.env.DISCORD_TICKET_REMIND_CHANNEL || "1504840589588299807";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await ensureSessionRoles();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.isStaff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
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

  const typeInfo = getTicketType(ticket.type);
  const ticketUrl = `${getSiteUrl()}/tickets/${ticket.id}`;

  const content = [
    `🔔 **Reminder: your ticket is still open**`,
    `Ticket: **${ticket.subject}**${typeInfo ? ` (${typeInfo.name})` : ""}`,
    `A member of staff is waiting on your reply. Respond on the site to keep things moving:`,
    ticketUrl,
  ].join("\n");

  let delivered: "dm" | "channel";
  const dmId = await openDm(ticket.userId);
  if (dmId && (await sendMessage(dmId, content))) {
    delivered = "dm";
  } else {
    await sendMessage(FALLBACK_CHANNEL, `⚠️ <@${ticket.userId}> DMs are closed — ${ticket.username} (ticket \`${ticket.id.slice(0, 8)}\`).\n${content}`);
    delivered = "channel";
  }

  return NextResponse.json({
    ok: true,
    delivered,
    user: ticket.username,
  });
}
