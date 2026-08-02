import { NextRequest, NextResponse } from "next/server";
import { getApplyConfig, APPLICATION_SLUGS } from "@/lib/apply.config";
import { getApplications } from "@/lib/applications.db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ dept: string }> }) {
  const roleLevel = req.headers.get("x-role-level");
  if (!roleLevel || roleLevel === "staff") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { dept } = await params;
  if (!APPLICATION_SLUGS.includes(dept)) {
    return NextResponse.json({ error: "Invalid department" }, { status: 400 });
  }

  const status = req.nextUrl.searchParams.get("status") || undefined;
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20", 10);

  const result = getApplications(dept, { status, page, limit });
  return NextResponse.json(result);
}
