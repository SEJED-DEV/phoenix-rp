import { NextResponse } from "next/server";
import { getSiteBranding } from "@/lib/site-branding";
import { getSession } from "@/lib/auth";
import { getThemeForUser } from "@/lib/user-themes.config";

export async function GET() {
  const branding = await getSiteBranding();
  const session = await getSession();
  const userTheme = getThemeForUser(session?.userId);
  if (userTheme) {
    return NextResponse.json({
      ...branding,
      siteName: userTheme.siteName || branding.siteName,
      colors: userTheme.colors ? { ...branding.colors, ...userTheme.colors } : branding.colors,
    });
  }
  return NextResponse.json(branding);
}
