export type BrandColorKey =
  | "crimson"
  | "crimson-deep"
  | "ember"
  | "gold"
  | "gold-bright"
  | "flame"
  | "bg"
  | "bg-warm"
  | "text"
  | "text-dim"
  | "text-muted";

export type BrandColors = Record<BrandColorKey, string>;

export const BRAND_COLOR_KEYS: BrandColorKey[] = [
  "crimson",
  "crimson-deep",
  "ember",
  "gold",
  "gold-bright",
  "flame",
  "bg",
  "bg-warm",
  "text",
  "text-dim",
  "text-muted",
];

export interface SiteBranding {
  siteName: string;
  siteTagline: string;
  siteLogo: string;
  discordInvite: string;
  serverIp: string;
  metaDescription: string;
  metaKeywords: string;
  colors: BrandColors;
}

export const DEFAULT_SITE_NAME = "Tunisian Phoenix RP";
export const DEFAULT_SITE_TAGLINE =
  "A Tunisian FiveM Roleplay Community — Born from fire, built by the community.";
export const DEFAULT_DISCORD_INVITE = "https://discord.gg/rapZCCQBv";
export const DEFAULT_SERVER_IP = "phoenixrp.venice-hosting.com";
export const DEFAULT_META_DESCRIPTION =
  "A Tunisian FiveM Roleplay Community — Born from fire, built by the community.";
export const DEFAULT_META_KEYWORDS =
  "FiveM, Roleplay, Tunisian, GTA V, RP, Phoenix, Tunisia, Community";

export const DEFAULT_BRAND_COLORS: BrandColors = {
  crimson: "#c41e3a",
  "crimson-deep": "#8b1428",
  ember: "#e85d04",
  gold: "#d4a44a",
  "gold-bright": "#f0c850",
  flame: "#ff6b35",
  bg: "#050507",
  "bg-warm": "#0a0806",
  text: "#f5f0e8",
  "text-dim": "#b8a98a",
  "text-muted": "#6b5e4a",
};

export const DEFAULT_BRANDING: SiteBranding = {
  siteName: DEFAULT_SITE_NAME,
  siteTagline: DEFAULT_SITE_TAGLINE,
  siteLogo: "",
  discordInvite: DEFAULT_DISCORD_INVITE,
  serverIp: DEFAULT_SERVER_IP,
  metaDescription: DEFAULT_META_DESCRIPTION,
  metaKeywords: DEFAULT_META_KEYWORDS,
  colors: { ...DEFAULT_BRAND_COLORS },
};

export function isHexColor(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}
