import { NextRequest, NextResponse } from "next/server";
import { getUserRolesFromHeaders } from "@/lib/permissions";
import { canEditSiteConfigScope } from "@/lib/site-config-access";
import { saveShopImage } from "@/lib/shop-uploads";

async function isAllowed(req: NextRequest): Promise<boolean> {
  const userId = req.headers.get("x-user-id") || "";
  const roles = getUserRolesFromHeaders(req.headers);
  return canEditSiteConfigScope(userId, roles, "content");
}

export async function POST(req: NextRequest) {
  if (!(await isAllowed(req))) {
    return NextResponse.json({ error: "Only the site owner or granted editors can upload shop images" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("image");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "An image file is required." }, { status: 400 });
  }

  const saved = await saveShopImage(file as unknown as { name: string; size: number; arrayBuffer(): Promise<ArrayBuffer> });
  if (saved.error || !saved.storedName) {
    return NextResponse.json({ error: saved.error || "Upload failed." }, { status: 400 });
  }

  return NextResponse.json({ file: saved.storedName });
}
