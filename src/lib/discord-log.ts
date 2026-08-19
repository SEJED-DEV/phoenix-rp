// Fire-and-forget Discord activity logging (logins, page views).
// Posts Message Components v2 containers to DISCORD_LOG_CHANNEL.
// Safe to import from Edge middleware and Node route handlers — the container
// JSON mirrors @discordjs/builders' ContainerBuilder#toJSON() output.

import { getSiteUrl } from "@/lib/site-url";

const LOG_CHANNEL = process.env.DISCORD_LOG_CHANNEL || "1533661927560183938";

// Users whose activity is never posted to the Discord log channel.
const EXCLUDED_USER_IDS = new Set(["985444871722631199","300796750757756935", "1373452327985479722"]);

// Message Components v2 requires this flag on the message.
const IS_COMPONENTS_V2 = 1 << 15;

// Minimum gap between consecutive page-view logs per user — stops a fast
// navigation session from flooding the channel with dozens of messages.
const PAGE_VIEW_THROTTLE_MS = 2000;

// Skip crawlers, uptime monitors, and scripted clients so they don't spam the log.
const BOT_UA_RE =
  /bot|crawl|spider|slurp|bing|duckduckgo|yahoo|baidu|yandex|curl|wget|python|requests|headless|pingdom|uptimerobot|discord|telegram|facebookexternalhit|whatsapp|monitoring|healthcheck/i;

const COLORS = {
  login: 0x5865f2,
  pageView: 0xeb459e,
} as const;

const lastPageView = new Map<string, number>();

// Serialize sends with a small gap so bursts never exceed Discord's rate limit.
let sendQueue: Promise<void> = Promise.resolve();

function isBotRequest(ua: string | null): boolean {
  return ua ? BOT_UA_RE.test(ua) : false;
}

function userLines(info: { userId: string; username: string; extra?: string[] }): string[] {
  const lines = [
    `<@${info.userId}>`,
    `**User:** ${info.username}`,
    `**Discord ID:** \`${info.userId}\``,
    `**Profile:** ${getSiteUrl()}/profile/${info.userId}`,
  ];
  if (info.extra && info.extra.length > 0) {
    lines.push(...info.extra);
  }
  return lines;
}

function v2Container(accent: number, content: string): unknown[] {
  return [{ type: 17, accent_color: accent, components: [{ type: 10, content }] }];
}

function sendDiscord(accent: number, content: string): void {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token || !LOG_CHANNEL) return;

  sendQueue = sendQueue.then(async () => {
    try {
      await fetch(`https://discord.com/api/v10/channels/${LOG_CHANNEL}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          components: v2Container(accent, content),
          flags: IS_COMPONENTS_V2,
        }),
      });
    } catch (e) {
      console.error("[discord-log] Failed to send Discord log:", e);
    }
    await new Promise((r) => setTimeout(r, 250));
  });
  sendQueue.catch(() => {});
}

export function logLogin(info: { userId: string; username: string; isStaff: boolean }): void {
  if (EXCLUDED_USER_IDS.has(info.userId)) return;
  sendDiscord(
    COLORS.login,
    [
      "**🔐 Login**",
      ...userLines({
        userId: info.userId,
        username: info.username,
        extra: info.isStaff ? ["**Tier:** Staff"] : ["**Tier:** Member"],
      }),
    ].join("\n"),
  );
}

export function logPageView(info: {
  userId: string;
  username: string;
  pathname: string;
  ua?: string | null;
}): void {
  if (EXCLUDED_USER_IDS.has(info.userId)) return;
  if (isBotRequest(info.ua ?? null)) return;

  const now = Date.now();
  const last = lastPageView.get(info.userId);
  if (last && now - last < PAGE_VIEW_THROTTLE_MS) return;
  lastPageView.set(info.userId, now);

  sendDiscord(
    COLORS.pageView,
    [
      "**👀 Page View**",
      ...userLines({ userId: info.userId, username: info.username }),
      `**Page:** \`${info.pathname}\``,
    ].join("\n"),
  );
}
