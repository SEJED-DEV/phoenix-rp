// Fire-and-forget Discord activity logging (logins, page views).
// Posts to DISCORD_LOG_CHANNEL; skipped silently if the bot token is missing.
// Safe to import from Edge middleware and Node route handlers.

const LOG_CHANNEL = process.env.DISCORD_LOG_CHANNEL || "1533661927560183938";

// Minimum gap between consecutive page-view logs per user — stops a fast
// navigation session from flooding the channel with dozens of messages.
const PAGE_VIEW_THROTTLE_MS = 2000;

// Skip crawlers, uptime monitors, and scripted clients so they don't spam the log.
const BOT_UA_RE =
  /bot|crawl|spider|slurp|bing|duckduckgo|yahoo|baidu|yandex|curl|wget|python|requests|headless|pingdom|uptimerobot|discord|telegram|facebookexternalhit|whatsapp|monitoring|healthcheck/i;

const lastPageView = new Map<string, number>();

// Serialize sends with a small gap so bursts never exceed Discord's rate limit.
let sendQueue: Promise<void> = Promise.resolve();

function isBotRequest(ua: string | null): boolean {
  return ua ? BOT_UA_RE.test(ua) : false;
}

function sendDiscord(content: string): void {
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
        body: JSON.stringify({ content }),
      });
    } catch (e) {
      console.error("[discord-log] Failed to send Discord log:", e);
    }
    await new Promise((r) => setTimeout(r, 250));
  });
  sendQueue.catch(() => {});
}

export function logLogin(info: { userId: string; username: string; isStaff: boolean }): void {
  const roleTag = info.isStaff ? " · **staff**" : "";
  sendDiscord(
    `🔐 **Login** — <@${info.userId}> **${info.username}** (\`${info.userId}\`)${roleTag}`
  );
}

export function logPageView(info: {
  userId: string;
  username: string;
  pathname: string;
  ua?: string | null;
}): void {
  if (isBotRequest(info.ua ?? null)) return;

  const now = Date.now();
  const last = lastPageView.get(info.userId);
  if (last && now - last < PAGE_VIEW_THROTTLE_MS) return;
  lastPageView.set(info.userId, now);

  sendDiscord(
    `👀 **Page View** — <@${info.userId}> **${info.username}** opened \`${info.pathname}\``
  );
}
