import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const MEDIA_DIR = path.join(process.cwd(), "public", "media");
const EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".webm"];

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!fs.existsSync(MEDIA_DIR)) {
      return NextResponse.json([], { headers: { "Cache-Control": "no-store" } });
    }
    const files = fs
      .readdirSync(MEDIA_DIR)
      .filter((f) => EXTENSIONS.some((ext) => f.toLowerCase().endsWith(ext)))
      .map((f) => ({
        name: f,
        isVideo: /\.(mp4|webm)$/i.test(f),
        src: `/media/${encodeURIComponent(f)}`,
      }));
    return NextResponse.json(files, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json([], { headers: { "Cache-Control": "no-store" } });
  }
}
