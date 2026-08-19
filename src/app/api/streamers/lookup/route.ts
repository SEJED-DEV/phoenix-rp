import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SOCIAL_URL_MAP: Record<string, (v: string) => string> = {
  instagram: (v) => `https://instagram.com/${v.replace(/^@/, "")}`,
  twitter: (v) => `https://x.com/${v.replace(/^@/, "")}`,
  youtube: (v) => v.startsWith("http") ? v : v.startsWith("channel/") || v.startsWith("@") ? `https://youtube.com/${v}` : `https://youtube.com/@${v}`,
  discord: (v) => v.startsWith("http") ? v : `https://discord.gg/${v}`,
  tiktok: (v) => `https://tiktok.com/@${v.replace(/^@/, "")}`,
  facebook: (v) => `https://facebook.com/${v.replace(/^@/, "")}`,
};

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username");
  const platform = req.nextUrl.searchParams.get("platform");

  if (!username || typeof username !== "string") {
    return NextResponse.json({ error: "Missing ?username=" }, { status: 400 });
  }

  const slug = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");

  if (!slug) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  if (platform === "kick" || !platform) {
    const headers = {
      Accept: "application/json, text/plain, */*",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "cross-site",
    };

    async function tryFetch(url: string): Promise<typeof data | null> {
      let data: Record<string, unknown> | null = null;
      try {
        const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
        if (res.ok) data = await res.json();
      } catch {}
      return data;
    }

    let data = await tryFetch(`https://kick.com/api/v2/channels/${encodeURIComponent(slug)}`);
    if (!data) data = await tryFetch(`https://kick.com/api/v1/channels/${encodeURIComponent(slug)}`);

    if (data) {
      const socialLinks: { platform: string; url: string }[] = [];
      const SOCIAL_KEYS = ["twitter", "instagram", "youtube", "tiktok", "discord", "facebook"];
      const user = (data as Record<string, unknown>)?.user as Record<string, unknown> | undefined;
      const socialsObj = (data as Record<string, unknown>)?.socials;

      if (socialsObj && typeof socialsObj === "object") {
        for (const [p, v] of Object.entries(socialsObj as Record<string, string>)) {
          if (typeof v === "string" && v.trim()) {
            const urlFn = SOCIAL_URL_MAP[p];
            socialLinks.push({ platform: p, url: urlFn ? urlFn(v.trim()) : v.trim() });
          }
        }
      }

      if (socialLinks.length === 0 && user) {
        for (const key of SOCIAL_KEYS) {
          const val = user[key];
          if (typeof val === "string" && val.trim()) {
            const urlFn = SOCIAL_URL_MAP[key];
            socialLinks.push({ platform: key, url: urlFn ? urlFn(val.trim()) : val.trim() });
          }
        }
      }

      const slugOrUsername = (data as Record<string, unknown>)?.slug || (data as Record<string, unknown>)?.username || slug;

      return NextResponse.json({
        username: slugOrUsername,
        displayName: user?.username || (data as Record<string, unknown>)?.username || slugOrUsername,
        avatarUrl: user?.profile_pic || (data as Record<string, unknown>)?.profile_pic || "",
        socialLinks,
      });
    }
  }

  return NextResponse.json({
    username: slug,
    displayName: slug,
    avatarUrl: "",
    socialLinks: [],
  });
}
