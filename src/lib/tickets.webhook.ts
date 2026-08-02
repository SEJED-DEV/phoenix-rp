import { ContainerBuilder, TextDisplayBuilder } from "@discordjs/builders";
import { sendContainer } from "./discord";
import { getTicketType } from "./tickets.config";
import type { Ticket } from "./tickets.db";

const TICKETS_CHANNEL = process.env.DISCORD_TICKETS_CHANNEL;

export async function sendTicketNotification(ticket: Ticket, ticketUrl: string): Promise<void> {
  if (!TICKETS_CHANNEL) {
    console.warn("DISCORD_TICKETS_CHANNEL not set, skipping ticket notification");
    return;
  }

  const ticketType = getTicketType(ticket.type);
  const typeName = ticketType?.name ?? ticket.type;

  const lines = [
    `@here **New Ticket — ${typeName}**`,
    `**${ticket.subject}**`,
    `<@${ticket.userId}> (${ticket.username}) opened a ${typeName.toLowerCase()} ticket.`,
    `Priority: ${(ticket.priority || "medium").toUpperCase()}`,
    `[View ticket](${ticketUrl})`,
  ];

  const container = new ContainerBuilder()
    .setAccentColor(ticketType?.color ?? 0x5865f2)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join("\n")));

  const ok = await sendContainer(TICKETS_CHANNEL, [container.toJSON()]);
  if (!ok) console.error("[tickets] Failed to post ticket notification");
}
