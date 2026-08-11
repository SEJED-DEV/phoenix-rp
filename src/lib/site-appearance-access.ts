/**
 * Site Appearance access control.
 *
 * The ONLY person allowed to edit the site's branding is decided by a file the
 * site owner keeps OUTSIDE this machine (next to the kill-switch panic.json in
 * their control repo). This code only holds a pointer to that file — the
 * authorized Discord ID never exists anywhere on this box, and the machine
 * operator cannot change it without editing source.
 *
 * Failing closed on purpose: if the control repo is unreachable, nobody gets
 * access (including the owner) rather than risking a wider grant.
 */

const SITE_APPEARANCE_OWNER_URL =
  "https://raw.githubusercontent.com/sejed2732-gif/site-access/refs/heads/main/site-appearance.json";

const CACHE_TTL_MS = 60_000;
const FAIL_CACHE_TTL_MS = 15_000;

let cached: { ownerId: string; at: number } | null = null;
let lastFailureAt = 0;

async function fetchOwnerId(): Promise<string | null> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.ownerId;
  }
  if (lastFailureAt && Date.now() - lastFailureAt < FAIL_CACHE_TTL_MS) {
    return null;
  }
  try {
    const res = await fetch(SITE_APPEARANCE_OWNER_URL, {
      cache: "no-store",
      headers: { Pragma: "no-cache", "Cache-Control": "no-cache" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      lastFailureAt = Date.now();
      return null;
    }
    const data = (await res.json()) as { ownerId?: unknown };
    const ownerId = String(data?.ownerId ?? "").trim();
    if (!/^\d{10,25}$/.test(ownerId)) {
      lastFailureAt = Date.now();
      return null;
    }
    cached = { ownerId, at: Date.now() };
    return ownerId;
  } catch {
    lastFailureAt = Date.now();
    return null;
  }
}

export async function isSiteAppearanceOwner(userId: string): Promise<boolean> {
  if (!userId) return false;
  const ownerId = await fetchOwnerId();
  return !!ownerId && ownerId === userId;
}
