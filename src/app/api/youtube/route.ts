import { NextResponse } from "next/server";

const CHANNEL_ID = "UCzLslLnU7gpFoiO3duTlZ6A";

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  published: string;
}

export async function GET() {
  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`,
      { next: { revalidate: 3600 } }
    );
    const xml = await res.text();

    const videos: YouTubeVideo[] = [];
    const entries = xml.split("<entry>").slice(1);

    for (const entry of entries) {
      const id = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1];
      const title = entry.match(/<media:group>[\s\S]*?<media:title>(.*?)<\/media:title>/)?.[1];
      const thumbnail = entry.match(/<media:thumbnail url="(.*?)"/)?.[1];
      const published = entry.match(/<published>(.*?)<\/published>/)?.[1];

      if (id && title) {
        videos.push({
          id,
          title: title.replace(/&amp;/g, "&").replace(/&#39;/g, "'"),
          thumbnail: thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          published: published || "",
        });
      }
    }

    return NextResponse.json(videos);
  } catch {
    return NextResponse.json([]);
  }
}
