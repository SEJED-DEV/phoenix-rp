import fs from "fs";
import path from "path";
import crypto from "crypto";
import { addTicketAttachment, type TicketAttachment } from "./tickets.db";

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
export const MAX_FILES_PER_UPLOAD = 8;

const UPLOADS_ROOT = path.join(process.cwd(), "data", "uploads", "tickets");

export interface UploadFile {
  name: string;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

// Extension -> mime. SVG is deliberately excluded (stored-XSS risk).
const ALLOWED_EXTENSIONS: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".log": "text/plain",
  ".zip": "application/zip",
  ".rar": "application/vnd.rar",
  ".json": "application/json",
  ".csv": "text/csv",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
};

function ticketDir(ticketId: string): string {
  return path.join(UPLOADS_ROOT, ticketId);
}

export function getAttachmentDiskPath(ticketId: string, storedName: string): string {
  return path.join(ticketDir(ticketId), storedName);
}

/** Removes a ticket's entire upload folder from disk (attachments are already deleted from the DB). */
export function deleteTicketFiles(ticketId: string): void {
  fs.rmSync(ticketDir(ticketId), { recursive: true, force: true });
}

export function validateUploadFiles(files: UploadFile[]): string | null {
  if (files.length === 0) return null;
  if (files.length > MAX_FILES_PER_UPLOAD) {
    return `You can attach up to ${MAX_FILES_PER_UPLOAD} files at a time.`;
  }
  for (const file of files) {
    const ext = path.extname(file.name || "").toLowerCase();
    if (!ALLOWED_EXTENSIONS[ext]) {
      return `"${file.name}" has an unsupported file type.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}" is larger than 10MB.`;
    }
  }
  return null;
}

export async function saveTicketAttachments(
  ticketId: string,
  uploaderId: string,
  uploaderName: string,
  files: UploadFile[],
  messageId: string | null = null
): Promise<{ attachments: TicketAttachment[]; error?: string }> {
  if (files.length === 0) return { attachments: [] };

  const error = validateUploadFiles(files);
  if (error) return { attachments: [], error };

  fs.mkdirSync(ticketDir(ticketId), { recursive: true });

  const attachments: TicketAttachment[] = [];
  for (const file of files) {
    const ext = path.extname(file.name || "").toLowerCase();
    const storedName = crypto.randomUUID() + ext;
    const buf = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(ticketDir(ticketId), storedName), buf);

    attachments.push(
      addTicketAttachment({
        ticketId,
        messageId,
        uploaderId,
        uploaderName,
        fileName: file.name,
        storedName,
        mimeType: ALLOWED_EXTENSIONS[ext],
        size: file.size,
      })
    );
  }

  return { attachments };
}
