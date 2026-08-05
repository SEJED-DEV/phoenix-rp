import { NextRequest, NextResponse } from "next/server";
import { APPLICATION_SLUGS, ON_SITE_APPLICATIONS } from "@/lib/apply.config";
import { countAllApplications, countApplicationsByStatus } from "@/lib/applications.db";
import { getRoleLevel, getUserRolesFromHeaders } from "@/lib/permissions";
import { canViewApplications, getViewableDepts, isHighRank } from "@/lib/application-questions";

export async function GET(req: NextRequest) {
  const roleLevel = getRoleLevel(req.headers);
  const userId = req.headers.get("x-user-id") || "";

  const { status, dept } = Object.fromEntries(req.nextUrl.searchParams);

  if (dept) {
    if (!APPLICATION_SLUGS.includes(dept)) {
      return NextResponse.json({ error: "Invalid department" }, { status: 400 });
    }
    if (!isHighRank(roleLevel)) {
      const roles = getUserRolesFromHeaders(req.headers);
      if (!canViewApplications(userId, roles, dept)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    const counts = countApplicationsByStatus(dept);
    return NextResponse.json(counts);
  }

  if (!isHighRank(roleLevel)) {
    const roles = getUserRolesFromHeaders(req.headers);
    const viewable = getViewableDepts(userId, roles, ON_SITE_APPLICATIONS);
    if (viewable.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const filtered = countAllApplications().filter((d) => viewable.includes(d.slug));
    return NextResponse.json(filtered);
  }

  const summary = countAllApplications();
  return NextResponse.json(summary);
}
