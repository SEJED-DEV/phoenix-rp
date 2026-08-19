import { NextRequest, NextResponse } from "next/server";
import { getDepartedMembers, getDepartedMemberCount } from "@/lib/departed.db";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "30", 10)));
  const offset = (page - 1) * limit;

  const search = q.length >= 2 ? q.trim() : undefined;
  const rows = getDepartedMembers(search, limit, offset);
  const total = getDepartedMemberCount(search);

  return NextResponse.json({ members: rows, total, page, limit });
}
