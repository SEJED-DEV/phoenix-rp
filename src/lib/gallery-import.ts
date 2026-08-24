import fs from "fs";
import path from "path";
import { getGuildMessage, getMemberInfo, parseDiscordMessageLink } from "./discord";

const MEDIA_DIR = path.join(process.cwd(), "public", "media");
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const ALLOWED_MEDIA: Record<string, "image" | "video"> = {
  ".png": "image",
  ".jpg": "image",
  ".jpeg": "image",
  ".gif": "image",
  ".webp": "image",
  ".mp4": "video",
  ".webm": "video",
};

export interface ImportedGalleryItem {
  filename: string;
  src: string;
  description: string;
  credits: string;
  isVideo: boolean;
}

export interface DiscordImportResult {
  items: ImportedGalleryItem[];
  errors: string[];
}

function extensionOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i).toLowerCase();
}

function classify(urlOrName: string): { kind: "image" | "video"; ext: string } | null {
  let pathname = urlOrName;
  try {
    pathname = new URL(urlOrName).pathname;
  } catch {}
  const ext = extensionOf(decodeURIComponent(pathname));
  const kind = ALLOWED_MEDIA[ext];
  if (!kind) return null;
  return { kind, ext };
}

function cleanDescription(content: string): string {
  return content
    .replace(/<@!?\d+>/g, "@user")
    .replace(/<@&\d+>/g, "@role")
    .replace(/<#\d+>/g, "#channel")
    .trim();
}

export function looksLikeDiscordMessageLink(input: string): boolean {
  return /discord\.com\/channels\//.test(input);
}

export async function importFromDiscordMessage(link: string): Promise<DiscordImportResult> {
  const parsed = parseDiscordMessageLink(link);
  if (!parsed) {
    return { items: [], errors: ["That doesn't look like a Discord message link."] };
  }

  const msg = await getGuildMessage(parsed.channelId, parsed.messageId);
  if (!msg) {
    return {
      items: [],
      errors: ["Could not fetch that message. Check the link and make sure the bot can read that channel."],
    };
  }

  const errors: string[] = [];
  const candidates: { url: string; filename: string; size: number }[] = [];

  for (const a of msg.attachments) {
    candidates.push({ url: a.url, filename: a.filename, size: a.size });
  }
  for (const u of msg.embedImageUrls) {
    if (!candidates.some((c) => c.url === u)) {
      candidates.push({ url: u, filename: decodeURIComponent(u.split("/").pop() || "").split("?")[0] || "embed", size: 0 });
    }
  }

  if (candidates.length === 0) {
    return { items: [], errors: ["That message has no images or videos attached."] };
  }

  let credits = msg.authorName;
  if (msg.authorId) {
    try {
      const info = await getMemberInfo(msg.authorId);
      credits = info?.nick || info?.username || msg.authorName;
    } catch {}
  }

  const description = cleanDescription(msg.content);

  fs.mkdirSync(MEDIA_DIR, { recursive: true });

  const items: ImportedGalleryItem[] = [];
  let n = 0;

  for (const c of candidates) {
    n++;
    const cls = classify(c.url) ?? classify(c.filename);
    if (!cls) {
      errors.push(`Skipped "${c.filename}" — unsupported file type.`);
      continue;
    }
    if (c.size > MAX_FILE_SIZE) {
      errors.push(`Skipped "${c.filename}" — larger than 20MB.`);
      continue;
    }
    const storedName = `discord-${msg.id}-${n}${cls.ext}`;
    try {
      const res = await fetch(c.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.byteLength > MAX_FILE_SIZE) throw new Error("too large");
      fs.writeFileSync(path.join(MEDIA_DIR, storedName), buf);
      items.push({
        filename: storedName,
        src: `/api/media/file/${encodeURIComponent(storedName)}`,
        description,
        credits,
        isVideo: cls.kind === "video",
      });
    } catch {
      errors.push(`Failed to download "${c.filename}".`);
    }
  }

  return { items, errors };
}
