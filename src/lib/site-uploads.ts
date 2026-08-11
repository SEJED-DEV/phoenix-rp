import fs from "fs";
import path from "path";
import crypto from "crypto";

export const MAX_SITE_LOGO_SIZE = 10 * 1024 * 1024; // 10MB

const SITE_UPLOADS_ROOT = path.join(process.cwd(), "data", "uploads", "site");

export const SITE_LOGO_EXTENSIONS: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
};

const STORED_NAME_RE = /^[a-f0-9-]{36}\.(png|jpg|jpeg|gif|webp|bmp)$/i;

export function getSiteLogoDiskPath(storedName: string): string {
  return path.join(SITE_UPLOADS_ROOT, storedName);
}

export function isValidSiteLogoName(storedName: string): boolean {
  return STORED_NAME_RE.test(storedName);
}

export interface SiteUploadFile {
  name: string;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export async function saveSiteLogo(file: SiteUploadFile): Promise<{ storedName: string; error?: string }> {
  const ext = path.extname(file.name || "").toLowerCase();
  if (!SITE_LOGO_EXTENSIONS[ext]) {
    return { storedName: "", error: "Only images are allowed (png, jpg, jpeg, gif, webp, bmp)." };
  }
  if (file.size > MAX_SITE_LOGO_SIZE) {
    return { storedName: "", error: "Image is larger than 10MB." };
  }

  const buf = Buffer.from(await file.arrayBuffer());
  fs.mkdirSync(SITE_UPLOADS_ROOT, { recursive: true });
  const storedName = crypto.randomUUID() + ext;
  fs.writeFileSync(getSiteLogoDiskPath(storedName), buf);
  return { storedName };
}

export function deleteSiteLogo(storedName: string): void {
  if (!isValidSiteLogoName(storedName)) return;
  try {
    fs.rmSync(getSiteLogoDiskPath(storedName), { force: true });
  } catch {
    // ignore
  }
}
