import { ContainerBuilder, TextDisplayBuilder } from "@discordjs/builders";
import { sendContainer, sendDmContainer } from "./discord";
import { getApplyConfig } from "./apply.config";

const COLORS = {
  new: 0xdc2626,
  approved: 0x10b981,
  denied: 0xef4444,
} as const;

const APPLICATIONS_CHANNEL = process.env.DISCORD_APPLICATIONS_CHANNEL;
const RESULT_CHANNEL = process.env.DISCORD_APPLICATIONS_RESULT_CHANNEL;

function toV2(container: ContainerBuilder): unknown[] {
  return [container.toJSON()];
}

function reviewLink(baseUrl: string, dept: string): string {
  return `[Staff Panel → Applications](${baseUrl}/staff-panel/applications/${dept})`;
}

export interface NewApplicationInfo {
  dept: string;
  id: number;
  userId: string;
  username: string;
}

export async function notifyNewApplication(info: NewApplicationInfo, baseUrl: string): Promise<void> {
  const config = getApplyConfig(info.dept);
  const container = new ContainerBuilder()
    .setAccentColor(COLORS.new)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          `@here **New Application Submitted**`,
          `${info.username} applied for **${config?.label ?? info.dept}** (Application #${info.id}).`,
          `<@${info.userId}> — ${reviewLink(baseUrl, info.dept)}`,
        ].join("\n"),
      ),
    );

  if (APPLICATIONS_CHANNEL) {
    const ok = await sendContainer(APPLICATIONS_CHANNEL, toV2(container));
    if (!ok) console.error("[notify] Failed to post new-application container");
  }
}

export interface ApplicationResultInfo {
  dept: string;
  id: number;
  discordId: string;
  username: string;
  status: "approved" | "denied";
  note?: string;
  reviewerId?: string;
  reviewerName?: string;
}

export async function notifyApplicationResult(info: ApplicationResultInfo, baseUrl: string): Promise<void> {
  const config = getApplyConfig(info.dept);
  const approved = info.status === "approved";

  const label = `**${config?.label ?? info.dept}**`;
  const statusText = approved ? "approved" : "denied";
  const noteLine = info.note ? `Reviewer note: ${info.note}` : null;
  const reviewerLine = info.reviewerName ? `Reviewed by: ${info.reviewerName}` : null;

  const channelLines = [
    `@here **Application ${approved ? "Approved" : "Denied"}**`,
    `<@${info.discordId}> — ${info.username}'s application for ${label} was ${statusText}.`,
    reviewLink(baseUrl, info.dept),
  ];
  if (noteLine) channelLines.push(noteLine);
  if (reviewerLine) channelLines.push(reviewerLine);

  const dmLines = [
    `**Application ${approved ? "Approved" : "Denied"}**`,
    `<@${info.discordId}> — your application for ${label} was ${statusText}.`,
  ];
  if (noteLine) dmLines.push(noteLine);
  if (reviewerLine) dmLines.push(reviewerLine);

  const channelContainer = new ContainerBuilder()
    .setAccentColor(approved ? COLORS.approved : COLORS.denied)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(channelLines.join("\n")));

  const dmContainer = new ContainerBuilder()
    .setAccentColor(approved ? COLORS.approved : COLORS.denied)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(dmLines.join("\n")));

  const posts: Promise<boolean>[] = [];
  if (RESULT_CHANNEL) {
    posts.push(sendContainer(RESULT_CHANNEL, toV2(channelContainer)));
  }
  posts.push(sendDmContainer(info.discordId, toV2(dmContainer)));

  const results = await Promise.allSettled(posts);
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[notify] Failed to deliver application result:", result.reason);
    }
  }
}
