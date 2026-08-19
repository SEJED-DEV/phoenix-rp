import { type BrandColors } from "./site-branding.types";

export interface UserTheme {
  userId: string;
  label: string;
  siteName?: string;
  colors: Partial<BrandColors>;
  extra?: Record<string, string>;
  backgroundImage?: string;
  backgroundOverlay?: string;
  logo?: string;
}

export const USER_THEMES: UserTheme[] = [
  {
    userId: "985444871722631199",
    label: "Creator (Midnight)",
    siteName: "Cortex HQ",
    colors: {
      bg: "#000000",
      "bg-warm": "#0a0a0a",
      text: "#ffffff",
      "text-dim": "#d1d5db",
      "text-muted": "#9ca3af",
      "gold-bright": "#ffffff",
      gold: "#e5e7eb",
      flame: "#f3f4f6",
      crimson: "#d1d5db",
      ember: "#9ca3af",
      "crimson-deep": "#6b7280",
    },
    extra: {
      "--color-surface": "#111111",
      "--color-surface-2": "#161616",
      "--color-surface-3": "#1c1c1c",
      "--color-border": "rgba(255,255,255,0.12)",
      "--color-border-light": "rgba(255,255,255,0.2)",
    },
    backgroundImage:
      "https://raw.githubusercontent.com/SEJED-DEV/sejed-portfolio/main/public/cortexcback.png",
    backgroundOverlay: "rgba(0,0,0,0.65)",
    logo: "https://raw.githubusercontent.com/SEJED-DEV/sejed-portfolio/7b7280ee912915eb8a39f555ed4c34e28bda5496/public/emojie.png",
  },
];

export function getThemeForUser(userId?: string | null): UserTheme | null {
  if (!userId) return null;
  return USER_THEMES.find((t) => t.userId === userId) ?? null;
}
