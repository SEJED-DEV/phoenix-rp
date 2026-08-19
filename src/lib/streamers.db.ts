import { getDb } from "./db";

export type StreamerPlatform = "twitch" | "youtube" | "kick" | "tiktok";

export interface SocialLink {
  platform: string;
  url: string;
}

export interface Streamer {
  id: string;
  platform: StreamerPlatform;
  username: string;
  displayName: string;
  avatarUrl: string;
  channelUrl: string;
  socialLinks: SocialLink[];
  position: number;
}

export function getStreamers(): Streamer[] {
  const db = getDb();
  const rows = db.prepare("SELECT id, platform, username, displayName, avatarUrl, channelUrl, socialLinks, position FROM streamers ORDER BY position ASC").all() as (Omit<Streamer, "socialLinks"> & { socialLinks: string })[];
  return rows.map((r) => ({
    ...r,
    socialLinks: (() => { try { return JSON.parse(r.socialLinks); } catch { return []; } })(),
  }));
}

export function upsertStreamers(items: { id: string; platform: string; username: string; displayName: string; avatarUrl: string; channelUrl: string; socialLinks?: SocialLink[] }[]): void {
  const db = getDb();
  const tx = db.transaction(() => {
    db.exec("DELETE FROM streamers");
    const ins = db.prepare("INSERT INTO streamers (id, platform, username, displayName, avatarUrl, channelUrl, socialLinks, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      ins.run(it.id, it.platform, it.username, it.displayName, it.avatarUrl, it.channelUrl, JSON.stringify(it.socialLinks || []), i);
    }
  });
  tx();
}
