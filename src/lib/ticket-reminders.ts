import { ContainerBuilder, TextDisplayBuilder } from "@discordjs/builders";
import { sendContainer } from "@/lib/discord";
import { getStaleTickets, setStaffReminderSent, logTicketActivity } from "@/lib/tickets.db";
import { getTicketType } from "@/lib/tickets.config";
import { getSiteUrl } from "@/lib/site-url";

const REMINDER_CHANNEL = "1539611329256751136";

export async function scanAndNotifyStaleTickets(): Promise<{ notified: number }> {
  const stale = getStaleTickets();
  if (stale.length === 0) return { notified: 0 };

  const siteUrl = getSiteUrl();

  const ticketLines = stale.map((t) => {
    const typeName = getTicketType(t.type)?.name || t.type;
    const assignee = t.assignedToUsername ? ` → @${t.assignedToUsername}` : "";
    return `• **${t.subject}** (${typeName}) by @${t.username}${assignee} — idle ${t.idleHours}h`;
  });

  const container = new ContainerBuilder()
    .setAccentColor(0xef4444)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent([
        `@everyone **Ticket Inactivity Alert — ${stale.length} ticket${stale.length > 1 ? "s" : ""} idle**`,
        "",
        ...ticketLines,
        "",
        `[View Tickets](${siteUrl}/tickets)`,
      ].join("\n"))
    );

  const ok = await sendContainer(REMINDER_CHANNEL, [container.toJSON()]);
  if (!ok) {
    console.error("[ticket-reminders] Failed to send stale ticket notification");
    return { notified: 0 };
  }

  for (const t of stale) {
    setStaffReminderSent(t.id);
    logTicketActivity(t.id, `Staff inactivity reminder sent — ticket idle for ${t.idleHours}h`);
  }

  return { notified: stale.length };
}
