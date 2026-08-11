import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { getShopImageDiskPath, isValidShopImageName, SHOP_IMAGE_EXTENSIONS } from "@/lib/shop-uploads";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  if (!isValidShopImageName(name)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const diskPath = getShopImageDiskPath(name);
  if (!fs.existsSync(diskPath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
  const mime = SHOP_IMAGE_EXTENSIONS[ext] || "application/octet-stream";
  const data = fs.readFileSync(diskPath);

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(data.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": "inline",
    },
  });
}
