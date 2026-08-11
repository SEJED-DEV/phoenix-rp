import { getDb } from "@/lib/db";
import type { ConsoleEntry } from "@/lib/console-relay";

/**
 * Console relay delivery engine. Runs in its own process (`relay-worker.ts`)
 * and drains `console_entries` written by the site, bot, and tunnel processes.
 *
 * Everything is posted as Message Components v2 containers (flags 1 << 15),
 * never embeds. Sends are paced so bursts never trip Discord's rate limit, and
 * every 429 is honored (sleep for retry_after) before retrying the batch.
 */

const CHANNEL_ID = process.env.DISCORD_CONSOLE_CHANNEL || "";
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "";

const POLL_INTERVAL_MS = 500;
const PACE_MS = (() => {
  const v = Number(process.env.CONSOLE_RELAY_DELAY_MS || "1000");
  return Number.isFinite(v) && v >= 250 ? Math.floor(v) : 1000;
})();
const MAX_BATCH_CHARS = 1900;
const MAX_ENTRY_CHARS = 1850;
const MAX_SEND_RETRIES = 5;

// Message Components v2 requires this flag on the message.
const IS_COMPONENTS_V2 = 1 << 15;

const LEVEL_COLORS: Record<string, number> = {
  log: 0x9ca3af,
  info: 0x60a5fa,
  warn: 0xf59e0b,
  error: 0xef4444,
};

const SOURCE_LABELS: Record<string, string> = {
  site: "🌐 site",
  bot: "🤖 bot",
  tunnel: "🛰️ tunnel",
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function label(source: string): string {
  return SOURCE_LABELS[source] || source;
}

function entryContent(e: ConsoleEntry): string {
  let body = e.content;
  if (body.length > MAX_ENTRY_CHARS) {
    body = body.slice(0, MAX_ENTRY_CHARS) + "\n… [truncated]";
  }
  return `**\`${label(e.source)} / ${e.level.toUpperCase()}\`**\n${body}`;
}

function containerFor(batch: ConsoleEntry[]): unknown {
  const components = batch.map((e) => ({
    type: 10,
    content: entryContent(e),
  }));
  return [
    {
      type: 17,
      accent_color: batch.length === 1 ? LEVEL_COLORS[batch[0].level] ?? 0x9ca3af : 0x9ca3af,
      components,
    },
  ];
}

async function sendBatch(batch: ConsoleEntry[]): Promise<{ ok: boolean; retryAfterMs?: number }> {
  const res = await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ components: containerFor(batch), flags: IS_COMPONENTS_V2 }),
  });

  if (res.ok) return { ok: true };

  let retryAfterMs: number | undefined;
  if (res.status === 429) {
    try {
      const body = await res.json();
      retryAfterMs = Math.max(1000, Number(body?.retry_after ?? 0) * 1000);
    } catch {
      retryAfterMs = 2000;
    }
  }
  return { ok: false, retryAfterMs };
}

async function deliver(batch: ConsoleEntry[]): Promise<void> {
  const db = getDb();
  for (let attempt = 0; attempt < MAX_SEND_RETRIES; attempt++) {
    const result = await sendBatch(batch);
    if (result.ok) {
      const ids = batch.map((e) => e.id);
      db.prepare(
        `UPDATE console_entries SET status = 'sent' WHERE id IN (${ids.map(() => "?").join(",")})`
      ).run(...ids);
      return;
    }
    if (result.retryAfterMs !== undefined) {
      console.warn(
        `[relay] Discord rate limited; sleeping ${result.retryAfterMs}ms before retry (${attempt + 1}/${MAX_SEND_RETRIES})`
      );
      await sleep(result.retryAfterMs);
      continue;
    }
    console.error("[relay] send failed (non-rate-limit), marking batch failed");
    break;
  }
  const ids = batch.map((e) => e.id);
  db.prepare(
    `UPDATE console_entries SET status = 'failed' WHERE id IN (${ids.map(() => "?").join(",")})`
  ).run(...ids);
}

async function drainOnce(): Promise<boolean> {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM console_entries WHERE status = 'pending' ORDER BY id LIMIT 25")
    .all() as ConsoleEntry[];

  if (rows.length === 0) return false;

  // Bucket entries into batches that each fit under the message size cap.
  const batches: ConsoleEntry[][] = [];
  let current: ConsoleEntry[] = [];
  let size = 0;

  for (const row of rows) {
    const content = entryContent(row);
    if (current.length > 0 && size + content.length > MAX_BATCH_CHARS) {
      batches.push(current);
      current = [];
      size = 0;
    }
    current.push(row);
    size += content.length;
  }
  if (current.length > 0) batches.push(current);

  for (const batch of batches) {
    await deliver(batch);
    await sleep(PACE_MS);
  }
  return true;
}

export async function runRelayWorker(): Promise<void> {
  if (!CHANNEL_ID || !BOT_TOKEN) {
    console.error("[relay] Missing DISCORD_CONSOLE_CHANNEL or DISCORD_BOT_TOKEN. Worker disabled.");
    return;
  }
  console.log(`[relay] worker started (pace: ${PACE_MS}ms / message)`);

  while (true) {
    try {
      await drainOnce();
    } catch (e) {
      console.error("[relay] worker loop error:", e);
    }
    await sleep(POLL_INTERVAL_MS);
  }
}

runRelayWorker();
