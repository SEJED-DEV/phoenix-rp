export interface GalleryItem {
  id: string;
  type: "image" | "video" | "youtube" | "facebook";
  src?: string;
  thumbnail?: string;
  url?: string;
  title?: string;
}

export const externalLinks: GalleryItem[] = [];
