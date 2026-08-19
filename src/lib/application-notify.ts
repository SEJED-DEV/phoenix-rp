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

const INTERVIEW_CHANNEL = "1504840565080985601";
const INTERVIEW_VOICE_CHANNEL = "1504840361535869091";
const STAFF_RESULT_CHANNEL = "1509811576428040243";

function toV2(container: ContainerBuilder): unknown[] {
  return [container.toJSON()];
}

function reviewLink(baseUrl: string, dept: string, id?: number): string {
  if (id != null) {
    return `[Staff Panel → Application #${id}](${baseUrl}/staff-panel/applications/${dept}/${id})`;
  }
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
  const reviewerLine = info.reviewerId ? `Reviewed by <@${info.reviewerId}>` : null;

  const channelLines = [
    `@here **Application ${approved ? "Approved" : "Denied"}**`,
    `<@${info.discordId}> — ${info.username}'s application for ${label} was ${statusText}.`,
    reviewLink(baseUrl, info.dept, info.id),
  ];
  if (noteLine) channelLines.push(noteLine);
  if (reviewerLine) channelLines.push(reviewerLine);

  const dmLines = [
    `**Application ${approved ? "Approved" : "Denied"}**`,
    `<@${info.discordId}> — your application for ${label} was ${statusText}.`,
  ];
  if (noteLine) dmLines.push(noteLine);

  const channelContainer = new ContainerBuilder()
    .setAccentColor(approved ? COLORS.approved : COLORS.denied)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(channelLines.join("\n")));

  const dmContainer = new ContainerBuilder()
    .setAccentColor(approved ? COLORS.approved : COLORS.denied)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(dmLines.join("\n")));

  const posts: Promise<boolean>[] = [];
  const resultChannel = info.dept.startsWith("staff_") ? STAFF_RESULT_CHANNEL : RESULT_CHANNEL;
  if (resultChannel) {
    posts.push(sendContainer(resultChannel, toV2(channelContainer)));
  }
  posts.push(sendDmContainer(info.discordId, toV2(dmContainer)));

  const results = await Promise.allSettled(posts);
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[notify] Failed to deliver application result:", result.reason);
    }
  }
}

export async function notifyWhitelistResult(info: ApplicationResultInfo, _baseUrl: string): Promise<void> {
  const approved = info.status === "approved";
  const noteLine = info.note ? `Reviewer note: ${info.note}` : null;
  const interviewLine = `Please join the voice channel <#${INTERVIEW_VOICE_CHANNEL}> to proceed with your interview.`;

  const channelLines = [
    `<@${info.discordId}> — ${info.username}'s whitelist application was **${approved ? "approved" : "denied"}**.`,
  ];
  if (approved) channelLines.push(interviewLine);
  if (noteLine) channelLines.push(noteLine);

  const dmLines = [
    `Your whitelist application was **${approved ? "approved" : "denied"}**.`,
  ];
  if (approved) dmLines.push(interviewLine);
  if (noteLine) dmLines.push(noteLine);

  const channelContainer = new ContainerBuilder()
    .setAccentColor(approved ? COLORS.approved : COLORS.denied)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(channelLines.join("\n")));

  const dmContainer = new ContainerBuilder()
    .setAccentColor(approved ? COLORS.approved : COLORS.denied)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(dmLines.join("\n")));

  const posts: Promise<boolean>[] = [sendContainer(INTERVIEW_CHANNEL, toV2(channelContainer))];
  posts.push(sendDmContainer(info.discordId, toV2(dmContainer)));

  const results = await Promise.allSettled(posts);
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[notify] Failed to deliver whitelist result:", result.reason);
    }
  }
}
