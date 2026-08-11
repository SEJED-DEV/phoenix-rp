import { getDb } from "./db";
import {
  BROADCAST_DELAY_MS,
  getBroadcastJob,
  markBroadcastJobFailed,
  type BroadcastJob,
  type RecipientStatus,
} from "./broadcast";

/**
 * Broadcast delivery engine. Runs inside its own process
 * (`broadcast-worker.ts`) so long DM runs never block the web app.
 *
 * Strict rate limiting on purpose: exactly one member is processed at a
 * time with at least BROADCAST_DELAY_MS between each, and every Discord 429
 * is honored (sleep for retry_after) before retrying. How long a full
 * server DM takes is intentionally slow — that is the point.
 */

const GUILD_ID = process.env.DISCORD_GUILD_ID || "";
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "";

const MAX_SEND_RETRIES = 5;
const MAX_CONSECUTIVE_RATE_LIMITS = 20;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface ApiResult {
  ok: boolean;
  status: RecipientStatus;
  error?: string;
  retryAfterMs?: number;
}

async function discordFetch(path: string, init?: RequestInit): Promise<{ status: number; data: Record<string, unknown> | null }> {
  const res = await fetch(`https://discord.com/api/v10${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      ...(init?.headers || {}),
    },
  });
  const text = await res.text();
  let data: Record<string, unknown> | null = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

function rateLimitResult(data: Record<string, unknown> | null, label: string): ApiResult {
  const retryAfterMs = Number(data?.retry_after ?? 0) * 1000;
  return {
    ok: false,
    status: "failed",
    error: `Discord rate limited while ${label}`,
    retryAfterMs: Math.max(1000, Math.min(retryAfterMs || 2000, 120_000)),
  };
}

async function sendDmOnce(userId: string, content: string): Promise<ApiResult> {
  // 1) Open (or find) the DM channel.
  const open = await discordFetch("/users/@me/channels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient_id: userId }),
  });

  if (open.status !== 200 && open.status !== 201) {
    if (open.status === 429) return rateLimitResult(open.data, "opening a DM");
    if (open.status === 403 || open.data?.code === 50007) {
      return { ok: false, status: "blocked", error: "User blocks DMs from the bot" };
    }
    return { ok: false, status: "failed", error: `Opening DM failed (HTTP ${open.status})` };
  }

  const dmId = open.data?.id as string | undefined;
  if (!dmId) return { ok: false, status: "failed", error: "No DM channel id returned" };

  // 2) Send the message into that DM channel.
  const send = await discordFetch(`/channels/${dmId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (send.status === 200 || send.status === 201) return { ok: true, status: "sent" };
  if (send.status === 429) return rateLimitResult(send.data, "sending a DM");
  if (send.status === 403 || send.data?.code === 50013 || send.data?.code === 50007) {
    return { ok: false, status: "blocked", error: "User blocks DMs from the bot" };
  }
  return { ok: false, status: "failed", error: `Sending DM failed (HTTP ${send.status})` };
}

async function sendDmWithRetry(userId: string, content: string): Promise<ApiResult> {
  let result: ApiResult | null = null;
  for (let attempt = 0; attempt < MAX_SEND_RETRIES; attempt++) {
    result = await sendDmOnce(userId, content);
    if (result.retryAfterMs === undefined) return result;
    await sleep(result.retryAfterMs);
  }
  return result ?? { ok: false, status: "failed", error: "Failed to send DM" };
}

async function fetchAllMembers(): Promise<{ id: string; username: string }[]> {
  const members: { id: string; username: string }[] = [];
  let after = "0";

  while (true) {
    const res = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=1000&after=${after}`, {
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Fetching guild members failed (HTTP ${res.status}): ${body}`);
    }
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    for (const m of batch) {
      if (m?.user?.id) members.push({ id: m.user.id, username: m.user.username || "" });
    }
    after = batch[batch.length - 1].user.id;
    if (batch.length < 1000) break;
  }

  return members;
}

async function processJob(job: BroadcastJob): Promise<void> {
  const db = getDb();

  // Ensure the recipient list exists (idempotent across worker restarts).
  const existing = db
    .prepare("SELECT COUNT(*) AS c FROM broadcast_recipients WHERE jobId = ?")
    .get(job.id) as { c: number };

  if (existing.c === 0) {
    let members: { id: string; username: string }[];
    try {
      members = await fetchAllMembers();
    } catch (e) {
      markBroadcastJobFailed(job.id, String(e));
      return;
    }
    db.prepare("UPDATE broadcast_jobs SET totalMembers = ? WHERE id = ?").run(members.length, job.id);
    const insert = db.prepare(
      "INSERT OR IGNORE INTO broadcast_recipients (jobId, userId, username) VALUES (?, ?, ?)"
    );
    const tx = db.transaction((rows: { id: string; username: string }[]) => {
      for (const m of rows) insert.run(job.id, m.id, m.username);
    });
    tx(members);
  }

  let consecutiveRateLimits = 0;

  // Consume pending recipients one at a time.
  while (true) {
    const current = getBroadcastJob(job.id);
    if (!current) return;
    if (current.status === "cancelled") {
      db.prepare(
        "UPDATE broadcast_recipients SET status = 'skipped', updatedAt = datetime('now') WHERE jobId = ? AND status = 'pending'"
      ).run(job.id);
      return;
    }

    const recipient = db
      .prepare("SELECT * FROM broadcast_recipients WHERE jobId = ? AND status = 'pending' ORDER BY id LIMIT 1")
      .get(job.id) as
      | { id: number; userId: string }
      | undefined;

    if (!recipient) break;

    const result = await sendDmWithRetry(recipient.userId, current.message);

    db.prepare(
      "UPDATE broadcast_recipients SET status = ?, attempts = attempts + 1, error = ?, updatedAt = datetime('now') WHERE id = ?"
    ).run(result.status, result.error ?? null, recipient.id);

    if (result.retryAfterMs !== undefined) {
      consecutiveRateLimits++;
      if (consecutiveRateLimits >= MAX_CONSECUTIVE_RATE_LIMITS) {
        markBroadcastJobFailed(job.id, "Discord kept rate limiting the bot; broadcast aborted.");
        return;
      }
    } else {
      consecutiveRateLimits = 0;
    }

    await sleep(BROADCAST_DELAY_MS);
  }

  db.prepare("UPDATE broadcast_jobs SET status = 'completed', completedAt = datetime('now') WHERE id = ?").run(job.id);
  console.log(`[broadcast] job #${job.id} completed`);
}

/** Claims the next job to work on — queued, or a running job left over from a crashed worker. */
function claimNextJob(): BroadcastJob | null {
  const db = getDb();
  const job = db
    .prepare("SELECT * FROM broadcast_jobs WHERE status IN ('queued', 'running') ORDER BY id LIMIT 1")
    .get() as BroadcastJob | undefined;
  if (!job) return null;

  if (job.status === "queued") {
    db.prepare("UPDATE broadcast_jobs SET status = 'running', startedAt = datetime('now') WHERE id = ?").run(job.id);
    console.log(`[broadcast] claimed job #${job.id}`);
  }

  return job;
}

export async function runBroadcastWorker(): Promise<void> {
  if (!GUILD_ID || !BOT_TOKEN) {
    console.error("[broadcast] Missing DISCORD_GUILD_ID or DISCORD_BOT_TOKEN. Worker disabled.");
    return;
  }

  console.log(`[broadcast] worker started (pacing: ${BROADCAST_DELAY_MS}ms / member)`);

  while (true) {
    try {
      const job = claimNextJob();
      if (job) {
        console.log(`[broadcast] processing job #${job.id} (${job.status})`);
        await processJob(job);
      }
    } catch (e) {
      console.error("[broadcast] worker loop error:", e);
    }
    await sleep(4000);
  }
}
