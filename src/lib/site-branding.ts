import { connection } from "next/server";
import { getDb } from "./db";
import {
  BRAND_COLOR_KEYS,
  DEFAULT_BRANDING,
  DEFAULT_BRAND_COLORS,
  isHexColor,
  type BrandColorKey,
  type SiteBranding,
} from "./site-branding.types";

const SETTING_KEYS = {
  siteName: "site_name",
  siteTagline: "site_tagline",
  siteLogo: "site_logo",
  discordInvite: "site_discord_invite",
  serverIp: "site_server_ip",
  metaDescription: "site_meta_description",
  metaKeywords: "site_meta_keywords",
  color: (key: BrandColorKey) => `site_color_${key}`,
} as const;

function readMap(): Record<string, string> {
  const db = getDb();
  const rows = db
    .prepare("SELECT key, value FROM server_config WHERE key LIKE 'site_%'")
    .all() as { key: string; value: string }[];
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return map;
}

export async function getSiteBranding(): Promise<SiteBranding> {
  await connection();
  const map = readMap();

  const colors = { ...DEFAULT_BRAND_COLORS };
  for (const key of BRAND_COLOR_KEYS) {
    const raw = map[SETTING_KEYS.color(key)];
    if (raw && isHexColor(raw)) colors[key] = raw.toLowerCase();
  }

  const discordInvite = map[SETTING_KEYS.discordInvite]?.trim() || DEFAULT_BRANDING.discordInvite;
  const serverIp = map[SETTING_KEYS.serverIp]?.trim() || DEFAULT_BRANDING.serverIp;

  return {
    siteName: map[SETTING_KEYS.siteName]?.trim() || DEFAULT_BRANDING.siteName,
    siteTagline: map[SETTING_KEYS.siteTagline]?.trim() || DEFAULT_BRANDING.siteTagline,
    siteLogo: map[SETTING_KEYS.siteLogo]?.trim() || "",
    discordInvite,
    serverIp,
    metaDescription: map[SETTING_KEYS.metaDescription]?.trim() || DEFAULT_BRANDING.metaDescription,
    metaKeywords: map[SETTING_KEYS.metaKeywords]?.trim() || DEFAULT_BRANDING.metaKeywords,
    colors,
  };
}

export interface SiteBrandingInput {
  siteName?: unknown;
  siteTagline?: unknown;
  siteLogo?: unknown;
  discordInvite?: unknown;
  serverIp?: unknown;
  metaDescription?: unknown;
  metaKeywords?: unknown;
  colors?: unknown;
}

export async function validateSiteBrandingInput(input: SiteBrandingInput): Promise<{
  valid: boolean;
  errors: string[];
  branding: SiteBranding;
}> {
  const errors: string[] = [];
  const current = await getSiteBranding();

  const siteName = String(input.siteName ?? "").trim();
  if (!siteName) errors.push("Site name is required.");
  else if (siteName.length > 60) errors.push("Site name must be 60 characters or fewer.");

  const siteTagline = String(input.siteTagline ?? "").trim();
  if (siteTagline.length > 160) errors.push("Site tagline must be 160 characters or fewer.");

  let siteLogo = String(input.siteLogo ?? "").trim();
  if (siteLogo && !/^[a-f0-9-]{36}\.(png|jpg|jpeg|gif|webp|bmp)$/i.test(siteLogo)) {
    errors.push("Logo reference is invalid.");
    siteLogo = "";
  }

  const discordInvite = String(input.discordInvite ?? "").trim();
  if (discordInvite && !/^https:\/\/discord(\.com|\.gg)\/[\w.-]+$/i.test(discordInvite)) {
    errors.push("Discord invite must be a valid discord.gg or discord.com link.");
  }

  const serverIp = String(input.serverIp ?? "").trim();
  if (!serverIp) errors.push("Server IP is required.");
  else if (serverIp.length > 80) errors.push("Server IP must be 80 characters or fewer.");

  const metaDescription = String(input.metaDescription ?? "").trim();
  if (metaDescription.length > 300) errors.push("Meta description must be 300 characters or fewer.");

  const metaKeywords = String(input.metaKeywords ?? "").trim();
  if (metaKeywords.length > 300) errors.push("Meta keywords must be 300 characters or fewer.");

  const colors: Partial<Record<BrandColorKey, string>> = {};
  if (input.colors && typeof input.colors === "object") {
    for (const key of BRAND_COLOR_KEYS) {
      const raw = (input.colors as Record<string, unknown>)[key];
      if (raw === undefined || raw === null || raw === "") {
        colors[key] = current.colors[key];
        continue;
      }
      if (!isHexColor(raw)) {
        errors.push(`"${key}" must be a hex color like #c41e3a.`);
        colors[key] = current.colors[key];
      } else {
        colors[key] = String(raw).trim().toLowerCase();
      }
    }
  } else {
    for (const key of BRAND_COLOR_KEYS) colors[key] = current.colors[key];
  }

  const branding: SiteBranding = {
    siteName: siteName || current.siteName,
    siteTagline: siteTagline || current.siteTagline,
    siteLogo: siteLogo || current.siteLogo,
    discordInvite: discordInvite || current.discordInvite,
    serverIp: serverIp || current.serverIp,
    metaDescription: metaDescription || current.metaDescription,
    metaKeywords: metaKeywords || current.metaKeywords,
    colors: { ...current.colors, ...colors },
  };

  return { valid: errors.length === 0, errors, branding };
}

export function updateSiteBranding(branding: SiteBranding): void {
  const db = getDb();
  const upsert = db.prepare(`
    INSERT INTO server_config (key, value, updatedAt) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = datetime('now')
  `);
  const tx = db.transaction(() => {
    upsert.run(SETTING_KEYS.siteName, branding.siteName);
    upsert.run(SETTING_KEYS.siteTagline, branding.siteTagline);
    upsert.run(SETTING_KEYS.siteLogo, branding.siteLogo);
    upsert.run(SETTING_KEYS.discordInvite, branding.discordInvite);
    upsert.run(SETTING_KEYS.serverIp, branding.serverIp);
    upsert.run(SETTING_KEYS.metaDescription, branding.metaDescription);
    upsert.run(SETTING_KEYS.metaKeywords, branding.metaKeywords);
    for (const key of BRAND_COLOR_KEYS) {
      upsert.run(SETTING_KEYS.color(key), branding.colors[key]);
    }
  });
  tx();
}

export function resetSiteBranding(): void {
  updateSiteBranding({
    siteName: DEFAULT_BRANDING.siteName,
    siteTagline: DEFAULT_BRANDING.siteTagline,
    siteLogo: "",
    discordInvite: DEFAULT_BRANDING.discordInvite,
    serverIp: DEFAULT_BRANDING.serverIp,
    metaDescription: DEFAULT_BRANDING.metaDescription,
    metaKeywords: DEFAULT_BRANDING.metaKeywords,
    colors: { ...DEFAULT_BRAND_COLORS },
  });
}
