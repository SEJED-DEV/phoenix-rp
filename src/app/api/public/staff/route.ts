import { NextResponse } from "next/server";
import { getStaffMembers } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function GET() {
  const members = await getStaffMembers();
  const res = NextResponse.json(members);
  res.headers.set("Cache-Control", "public, max-age=60, s-maxage=120");
  return res;
}
