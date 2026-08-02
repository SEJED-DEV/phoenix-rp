import { NextResponse } from "next/server";
import { getStaffMembers } from "@/lib/discord";

export const dynamic = "force-dynamic";

export async function GET() {
  const members = await getStaffMembers();
  return NextResponse.json(members);
}
