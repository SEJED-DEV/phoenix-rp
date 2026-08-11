import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSiteBranding } from "@/lib/site-branding";
import { getSiteLogoDiskPath, isValidSiteLogoName, SITE_LOGO_EXTENSIONS } from "@/lib/site-uploads";

const FALLBACK_LOGO = path.join(process.cwd(), "public", "logo.png");

export async function GET() {
  const branding = await getSiteBranding();

  if (branding.siteLogo && isValidSiteLogoName(branding.siteLogo)) {
    const diskPath = getSiteLogoDiskPath(branding.siteLogo);
    if (fs.existsSync(diskPath)) {
      const ext = branding.siteLogo.slice(branding.siteLogo.lastIndexOf(".")).toLowerCase();
      const mime = SITE_LOGO_EXTENSIONS[ext] || "image/png";
      const data = fs.readFileSync(diskPath);
      return new NextResponse(new Uint8Array(data), {
        headers: {
          "Content-Type": mime,
          "Content-Length": String(data.length),
          "Cache-Control": "public, max-age=86400",
          "Content-Disposition": "inline",
        },
      });
    }
  }

  if (fs.existsSync(FALLBACK_LOGO)) {
    const data = fs.readFileSync(FALLBACK_LOGO);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(data.length),
        "Cache-Control": "public, max-age=86400",
        "Content-Disposition": "inline",
      },
    });
  }

  return new NextResponse("Not found", { status: 404 });
}
