import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getUserRolesFromHeaders } from "@/lib/permissions";
import { canEditSiteConfigScope } from "@/lib/site-config-access";
import { getGalleryMeta, upsertGalleryItems } from "@/lib/gallery.db";
import { logStaffAction } from "@/lib/activity-log";

const MEDIA_DIR = path.join(process.cwd(), "public", "media");
const EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".webm"];

async function isAllowed(req: NextRequest): Promise<boolean> {
  const userId = req.headers.get("x-user-id") || "";
  const roles = getUserRolesFromHeaders(req.headers);
  return canEditSiteConfigScope(userId, roles, "gallery");
}

function isDiskFile(filename: string): boolean {
  return EXTENSIONS.some((ext) => filename.toLowerCase().endsWith(ext)) && !filename.startsWith("http");
}

export async function GET(req: NextRequest) {
  if (!(await isAllowed(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const meta = getGalleryMeta();
    const metaMap = new Map(meta.map((m) => [m.filename, m]));

    const items: { id: string; filename: string; isVideo: boolean; src: string; description: string; credits: string }[] = [];

    for (const m of meta) {
      const isDisk = isDiskFile(m.filename);
      const src = isDisk ? `/api/media/file/${encodeURIComponent(m.filename)}` : (m.src || m.filename);
      items.push({
        id: m.filename,
        filename: m.filename,
        isVideo: /\.(mp4|webm)$/i.test(src),
        src,
        description: m.description,
        credits: m.credits,
      });
    }

    return NextResponse.json({ items });
  } catch (e) {
    console.error("[gallery] GET error:", e);
    return NextResponse.json({ error: "Failed to load gallery" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await isAllowed(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { items?: { id?: string; filename?: string; src?: string; description?: string; credits?: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.items)) {
    return NextResponse.json({ error: "items array is required" }, { status: 400 });
  }

  const sanitized = body.items
    .filter((it) => (it.src || it.filename) && typeof (it.src || it.filename) === "string")
    .map((it) => {
      const src = String(it.src || "").trim();
      const filename = String(it.filename || "").trim();
      const key = filename || src;
      return {
        filename: key,
        src: src || `/api/media/file/${encodeURIComponent(filename)}`,
        description: String(it.description || "").trim().slice(0, 500),
        credits: String(it.credits || "").trim().slice(0, 100),
      };
    })
    .filter((it) => {
      if (it.src.startsWith("http")) return it.src.startsWith("http://") || it.src.startsWith("https://");
      return isDiskFile(it.filename);
    });

  upsertGalleryItems(sanitized);

  const actorId = req.headers.get("x-user-id") || "";
  const actorName = req.headers.get("x-user-name") || "Unknown";
  logStaffAction({
    actorId,
    actorName,
    action: "gallery_update",
    metadata: { count: sanitized.length },
  });

  return NextResponse.json({ success: true });
}
