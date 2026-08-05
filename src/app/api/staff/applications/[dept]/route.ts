import { NextRequest, NextResponse } from "next/server";
import { getApplyConfig, APPLICATION_SLUGS } from "@/lib/apply.config";
import { getApplications } from "@/lib/applications.db";
import { getLabelsForDept } from "@/lib/application-questions";
import { getRoleLevel, getUserRolesFromHeaders } from "@/lib/permissions";
import { canViewApplications, isHighRank } from "@/lib/application-questions";

export async function GET(req: NextRequest, { params }: { params: Promise<{ dept: string }> }) {
  const roleLevel = getRoleLevel(req.headers);
  const { dept } = await params;

  if (!APPLICATION_SLUGS.includes(dept)) {
    return NextResponse.json({ error: "Invalid department" }, { status: 400 });
  }

  if (!isHighRank(roleLevel)) {
    const userId = req.headers.get("x-user-id") || "";
    const roles = getUserRolesFromHeaders(req.headers);
    if (!canViewApplications(userId, roles, dept)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const status = req.nextUrl.searchParams.get("status") || undefined;
  const q = req.nextUrl.searchParams.get("q") || undefined;
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20", 10);

  const result = getApplications(dept, { status, page, limit, q });
  const labels = getLabelsForDept(dept);
  return NextResponse.json({ ...result, labels });
}
