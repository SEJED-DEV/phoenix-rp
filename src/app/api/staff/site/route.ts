import { NextRequest, NextResponse } from "next/server";
import { getUserRolesFromHeaders } from "@/lib/permissions";
import {
  getSiteBranding,
  updateSiteBranding,
  validateSiteBrandingInput,
} from "@/lib/site-branding";
import {
  BRAND_COLOR_KEYS,
  DEFAULT_BRAND_COLORS,
  type BrandColorKey,
} from "@/lib/site-branding.types";
import { isSiteAppearanceOwner } from "@/lib/site-appearance-access";
import {
  SITE_CONFIG_SCOPES,
  canEditSiteScope,
  type SiteConfigScope,
} from "@/lib/site-config-access";
import { logStaffAction } from "@/lib/activity-log";

const OWNER_ONLY_KEYS = ["siteName", "siteTagline", "siteLogo", "metaDescription", "metaKeywords"] as const;

async function getScopes(req: NextRequest): Promise<{ isOwner: boolean; scopes: SiteConfigScope[] }> {
  const userId = req.headers.get("x-user-id") || "";
  const roles = getUserRolesFromHeaders(req.headers);
  const isOwner = await isSiteAppearanceOwner(userId);
  const scopes = isOwner
    ? [...SITE_CONFIG_SCOPES]
    : SITE_CONFIG_SCOPES.filter((s) => canEditSiteScope(userId, roles, s));
  return { isOwner, scopes };
}

export async function GET(req: NextRequest) {
  const { isOwner, scopes } = await getScopes(req);
  if (!isOwner && scopes.length === 0) {
    return NextResponse.json({ error: "Only the site owner or granted editors can view site branding." }, { status: 403 });
  }

  const branding = await getSiteBranding();

  return NextResponse.json({
    branding,
    colorKeys: BRAND_COLOR_KEYS,
    defaults: DEFAULT_BRAND_COLORS,
    logoUrl: branding.siteLogo ? `/api/site/logo?v=${branding.siteLogo}` : "",
    isOwner,
    scopes,
  });
}

export async function PUT(req: NextRequest) {
  const userId = req.headers.get("x-user-id") || "";
  const username = req.headers.get("x-user-name") || "";

  const { isOwner, scopes } = await getScopes(req);
  if (scopes.length === 0) {
    return NextResponse.json({ error: "Only the site owner or granted editors can edit site branding." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isOwner) {
    const current = await getSiteBranding();
    const attempted: string[] = [];

    for (const key of OWNER_ONLY_KEYS) {
      const submitted = String(body[key] ?? "").trim();
      if (submitted && submitted !== String(current[key] ?? "").trim()) attempted.push(key);
    }

    if (body.colors && typeof body.colors === "object") {
      const submittedColors = body.colors as Record<string, unknown>;
      for (const key of BRAND_COLOR_KEYS) {
        const v = submittedColors[key];
        if (
          v !== undefined &&
          v !== null &&
          String(v).trim().toLowerCase() !== current.colors[key]
        ) {
          attempted.push(`colors.${key}`);
        }
      }
    }

    if (attempted.length > 0) {
      return NextResponse.json(
        { error: `Only the site owner can change: ${attempted.join(", ")}` },
        { status: 403 }
      );
    }

    body = {
      ...body,
      siteName: current.siteName,
      siteTagline: current.siteTagline,
      siteLogo: current.siteLogo,
      metaDescription: current.metaDescription,
      metaKeywords: current.metaKeywords,
      colors: { ...current.colors },
    };
  }

  const { valid, errors, branding } = await validateSiteBrandingInput(body);
  if (!valid) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  updateSiteBranding(branding);

  logStaffAction({
    actorId: userId,
    actorName: username,
    action: "site_branding_update",
    reason: isOwner ? "Site branding updated" : `Site branding updated (scope: ${scopes.join(", ")})`,
    metadata: {
      siteName: branding.siteName,
      siteTagline: branding.siteTagline,
      discordInvite: branding.discordInvite,
      serverIp: branding.serverIp,
      colors: Object.fromEntries(
        BRAND_COLOR_KEYS.map((k: BrandColorKey) => [k, branding.colors[k]])
      ),
    },
  });

  return NextResponse.json({ success: true, branding: await getSiteBranding() });
}
