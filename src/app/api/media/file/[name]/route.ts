import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const MEDIA_DIR = path.join(process.cwd(), "public", "media");

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name: rawName } = await params;
  const name = path.basename(decodeURIComponent(rawName));

  const ext = path.extname(name).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType || name.includes("/") || name.includes("\\") || name.startsWith(".")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filePath = path.join(MEDIA_DIR, name);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const buf = fs.readFileSync(filePath);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buf.byteLength),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to read media" }, { status: 500 });
  }
}
