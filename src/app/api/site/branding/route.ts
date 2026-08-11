import { NextResponse } from "next/server";
import { getSiteBranding } from "@/lib/site-branding";

export async function GET() {
  return NextResponse.json(await getSiteBranding());
}
