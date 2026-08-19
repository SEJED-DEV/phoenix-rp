import { NextRequest, NextResponse } from "next/server";
import { ensureSessionRoles } from "@/lib/auth";
import { getTicketById, logTicketActivity, canSendManualReminder, setReminderCooldown } from "@/lib/tickets.db";
import { getTicketType, canViewTicketType } from "@/lib/tickets.config";
import { openDm, sendDmContainer, sendContainer } from "@/lib/discord";
import { getSiteUrl } from "@/lib/site-url";
import { ContainerBuilder, TextDisplayBuilder } from "@discordjs/builders";

const REMIND_COOLDOWN_MIN = 30;
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

  const cooldown = canSendManualReminder(id);
  if (!cooldown.ok) {
    const retryAfterSec = Math.ceil((cooldown.retryAfterMs || 0) / 1000);
    return NextResponse.json(
      { error: "You can only remind this user once every 30 minutes.", retryAfter: retryAfterSec },
      { status: 429 }
    );
  }

  const typeInfo = getTicketType(ticket.type);
  const ticketUrl = `${getSiteUrl()}/tickets/${ticket.id}`;

  const container = new ContainerBuilder()
    .setAccentColor(0xfbbf24)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent([
        `🔔 **Reminder: your ticket is still open**`,
        `Ticket: **${ticket.subject}**${typeInfo ? ` (${typeInfo.name})` : ""}`,
        `A member of staff is waiting on your reply. Respond on the site to keep things moving:`,
        `[View Ticket](${ticketUrl})`,
      ].join("\n"))
    );

  let delivered: "dm" | "channel";
  const dmChannel = await openDm(ticket.userId);
  if (dmChannel && (await sendDmContainer(ticket.userId, [container.toJSON()]))) {
    delivered = "dm";
  } else {
    const fallbackContainer = new ContainerBuilder()
      .setAccentColor(0xfbbf24)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent([
          `⚠️ <@${ticket.userId}> DMs are closed — ${ticket.username} (ticket \`${ticket.id.slice(0, 8)}\`).`,
          `🔔 **Reminder: your ticket is still open**`,
          `Ticket: **${ticket.subject}**${typeInfo ? ` (${typeInfo.name})` : ""}`,
          `A member of staff is waiting on your reply. Respond on the site to keep things moving:`,
          `[View Ticket](${ticketUrl})`,
        ].join("\n"))
      );
    await sendContainer(FALLBACK_CHANNEL, [fallbackContainer.toJSON()]);
    delivered = "channel";
  }

  setReminderCooldown(id, REMIND_COOLDOWN_MIN);
  logTicketActivity(id, `Reminder sent by @${session.username} — delivered via ${delivered}`);

  return NextResponse.json({ ok: true, delivered, user: ticket.username });
}
