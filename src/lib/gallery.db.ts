import { getDb } from "./db";

export interface GalleryMeta {
  filename: string;
  description: string;
  credits: string;
  src: string;
}

export function getGalleryMeta(): GalleryMeta[] {
  const db = getDb();
  return db.prepare("SELECT filename, description, credits, src FROM gallery_items ORDER BY position ASC").all() as GalleryMeta[];
}

export function upsertGalleryItems(items: { filename: string; description: string; credits: string; src: string }[]): void {
  const db = getDb();
  const tx = db.transaction(() => {
    db.exec("DELETE FROM gallery_items");
    const ins = db.prepare("INSERT INTO gallery_items (filename, description, credits, src, position) VALUES (?, ?, ?, ?, ?)");
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      ins.run(it.filename, it.description, it.credits, it.src, i);
    }
  });
  tx();
}

export function deleteGalleryItem(filename: string): void {
  const db = getDb();
  db.prepare("DELETE FROM gallery_items WHERE filename = ?").run(filename);
}
