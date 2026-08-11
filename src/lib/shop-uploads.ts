import fs from "fs";
import path from "path";
import crypto from "crypto";

export const MAX_SHOP_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

const SHOP_UPLOADS_ROOT = path.join(process.cwd(), "data", "uploads", "shop");

// Extension -> mime. Images only (SVG is excluded — stored-XSS risk).
export const SHOP_IMAGE_EXTENSIONS: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
};

const STORED_NAME_RE = /^[a-f0-9-]{36}\.(png|jpg|jpeg|gif|webp|bmp)$/i;

export function getShopImageDiskPath(storedName: string): string {
  return path.join(SHOP_UPLOADS_ROOT, storedName);
}

export function isValidShopImageName(storedName: string): boolean {
  return STORED_NAME_RE.test(storedName);
}

export interface ShopUploadFile {
  name: string;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export async function saveShopImage(file: ShopUploadFile): Promise<{ storedName: string; error?: string }> {
  const ext = path.extname(file.name || "").toLowerCase();
  if (!SHOP_IMAGE_EXTENSIONS[ext]) {
    return { storedName: "", error: "Only images are allowed (png, jpg, jpeg, gif, webp, bmp)." };
  }
  if (file.size > MAX_SHOP_IMAGE_SIZE) {
    return { storedName: "", error: "Image is larger than 10MB." };
  }

  const buf = Buffer.from(await file.arrayBuffer());
  fs.mkdirSync(SHOP_UPLOADS_ROOT, { recursive: true });
  const storedName = crypto.randomUUID() + ext;
  fs.writeFileSync(getShopImageDiskPath(storedName), buf);
  return { storedName };
}

export async function saveRemoteShopImage(url: string): Promise<{ storedName: string; error?: string }> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "phoenix-site" } });
    if (!res.ok) return { storedName: "", error: "Could not download the image." };

    const contentType = res.headers.get("content-type") || "";
    const ext = Object.entries(SHOP_IMAGE_EXTENSIONS).find(([, mime]) => mime === contentType)?.[0];
    if (!ext) return { storedName: "", error: "The forum post image is not a supported type." };

    const buf = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(SHOP_UPLOADS_ROOT, { recursive: true });
    const storedName = crypto.randomUUID() + ext;
    fs.writeFileSync(getShopImageDiskPath(storedName), buf);
    return { storedName };
  } catch {
    return { storedName: "", error: "Image download failed." };
  }
}
