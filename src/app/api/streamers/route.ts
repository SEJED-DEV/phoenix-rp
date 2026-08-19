import { NextResponse } from "next/server";
import { getStreamers } from "@/lib/streamers.db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const streamers = getStreamers();
    return NextResponse.json(streamers, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json([], { headers: { "Cache-Control": "no-store" } });
  }
}
