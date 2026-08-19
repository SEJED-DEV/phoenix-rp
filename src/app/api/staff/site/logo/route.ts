import { NextRequest, NextResponse } from "next/server";
import { isSiteAppearanceOwner } from "@/lib/site-appearance-access";
import { getUserRolesFromHeaders } from "@/lib/permissions";
import { canEditSiteScope } from "@/lib/site-config-access";
import { saveSiteLogo, deleteSiteLogo, isValidSiteLogoName } from "@/lib/site-uploads";
import { getSiteBranding, updateSiteBranding } from "@/lib/site-branding";
import { logStaffAction } from "@/lib/activity-log";

async function assertEditor(req: NextRequest): Promise<string | null> {
  const userId = req.headers.get("x-user-id") || "";
  if (!userId) return null;
  if (await isSiteAppearanceOwner(userId)) return userId;
  const roles = getUserRolesFromHeaders(req.headers);
  if (canEditSiteScope(userId, roles, "site")) return userId;
  return null;
}

export async function POST(req: NextRequest) {
  const userId = await assertEditor(req);
  if (!userId) {
    return NextResponse.json({ error: "Only the site owner or a site branding editor can change the logo." }, { status: 403 });
  }
  const username = req.headers.get("x-user-name") || "";

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("logo");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "A logo image is required." }, { status: 400 });
  }

  const saved = await saveSiteLogo(file as unknown as { name: string; size: number; arrayBuffer(): Promise<ArrayBuffer> });
  if (saved.error || !saved.storedName) {
    return NextResponse.json({ error: saved.error || "Upload failed." }, { status: 400 });
  }

  const current = await getSiteBranding();
  if (current.siteLogo) deleteSiteLogo(current.siteLogo);
  updateSiteBranding({ ...current, siteLogo: saved.storedName });

  logStaffAction({
    actorId: userId,
    actorName: username,
    action: "site_branding_update",
    reason: "Logo changed",
    metadata: { logo: saved.storedName },
  });

  return NextResponse.json({ storedName: saved.storedName, logoUrl: `/api/site/logo?v=${saved.storedName}` });
}

export async function DELETE(req: NextRequest) {
  const userId = await assertEditor(req);
  if (!userId) {
    return NextResponse.json({ error: "Only the site owner or a site branding editor can change the logo." }, { status: 403 });
  }
  const username = req.headers.get("x-user-name") || "";

  let body: { storedName?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const storedName = String(body.storedName ?? "");
  if (!isValidSiteLogoName(storedName)) {
    return NextResponse.json({ error: "Invalid logo reference." }, { status: 400 });
  }

  const current = await getSiteBranding();
  if (current.siteLogo === storedName) {
    deleteSiteLogo(storedName);
    updateSiteBranding({ ...current, siteLogo: "" });
    logStaffAction({
      actorId: userId,
      actorName: username,
      action: "site_branding_update",
      reason: "Logo removed",
    });
  }

  return NextResponse.json({ success: true });
}
