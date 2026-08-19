import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getGalleryMeta } from "@/lib/gallery.db";

const MEDIA_DIR = path.join(process.cwd(), "public", "media");
const EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".webm"];

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const meta = getGalleryMeta();
    const metaMap = new Map(meta.map((m) => [m.filename, m]));

    const items: { name: string; isVideo: boolean; src: string; description?: string; credits?: string }[] = [];

    // DB items (URL-based or disk-based)
    for (const m of meta) {
      const isDisk = !m.src.startsWith("http") && EXTENSIONS.some((ext) => m.filename.toLowerCase().endsWith(ext));
      const src = isDisk ? `/media/${encodeURIComponent(m.filename)}` : m.src;
      items.push({
        name: m.filename,
        isVideo: /\.(mp4|webm)$/i.test(src),
        src,
        description: m.description || undefined,
        credits: m.credits || undefined,
      });
    }

    // Also include any disk files NOT in the DB (for backward compatibility)
    if (fs.existsSync(MEDIA_DIR)) {
      const dbFilenames = new Set(meta.map((m) => m.filename));
      const diskFiles = fs
        .readdirSync(MEDIA_DIR)
        .filter((f) => EXTENSIONS.some((ext) => f.toLowerCase().endsWith(ext)) && !dbFilenames.has(f));

      for (const f of diskFiles) {
        items.push({
          name: f,
          isVideo: /\.(mp4|webm)$/i.test(f),
          src: `/media/${encodeURIComponent(f)}`,
        });
      }
    }

    return NextResponse.json(items, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json([], { headers: { "Cache-Control": "no-store" } });
  }
}
