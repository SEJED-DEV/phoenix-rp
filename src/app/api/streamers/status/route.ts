import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface CacheEntry {
  data: LiveStatus;
  ts: number;
}

interface LiveStatus {
  isLive: boolean;
  title?: string;
  viewers?: number;
  category?: string;
  thumbnail?: string;
}

const CACHE = new Map<string, CacheEntry>();
const CACHE_TTL = 60_000;
const KICK_API = "https://kick.com/api/v2/channels";

let backoffUntil = 0;
let backoffMs = 5000;

function getCached(username: string): LiveStatus | null {
  const entry = CACHE.get(username);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    CACHE.delete(username);
    return null;
  }
  return entry.data;
}

function setCache(username: string, data: LiveStatus) {
  CACHE.set(username, { data, ts: Date.now() });
}

async function fetchKickStatus(username: string): Promise<LiveStatus> {
  if (Date.now() < backoffUntil) {
    return { isLive: false };
  }

  try {
    const res = await fetch(`${KICK_API}/${encodeURIComponent(username)}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      backoffMs = Math.min(backoffMs * 2, 120_000);
      backoffUntil = Date.now() + (retryAfter ? parseInt(retryAfter) * 1000 : backoffMs);
      console.warn(`[streamers-status] Kick 429, backing off ${backoffMs}ms`);
      return { isLive: false };
    }

    if (!res.ok) return { isLive: false };

    const data = await res.json();
    const livestream = data?.livestream;

    if (!livestream || !livestream.is_live) {
      return { isLive: false };
    }

    return {
      isLive: true,
      title: livestream.session_title || "",
      viewers: livestream.viewer_count || 0,
      category: livestream.categories?.[0]?.name || "",
      thumbnail: "",
    };
  } catch (err) {
    console.warn(`[streamers-status] Kick fetch failed for ${username}:`, err);
    return { isLive: false };
  }
}

export async function GET(req: NextRequest) {
  const usernames = req.nextUrl.searchParams.get("u");

  if (!usernames) {
    return NextResponse.json({ error: "Missing ?u= parameter" }, { status: 400 });
  }

  const users = usernames
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, 20);

  const results: Record<string, LiveStatus> = {};

  const toFetch: string[] = [];
  for (const u of users) {
    const cached = getCached(u);
    if (cached) {
      results[u] = cached;
    } else {
      toFetch.push(u);
    }
  }

  for (const u of toFetch) {
    const status = await fetchKickStatus(u);
    setCache(u, status);
    results[u] = status;
  }

  return NextResponse.json(results, {
    headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" },
  });
}
