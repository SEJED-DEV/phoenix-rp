import { NextRequest, NextResponse } from "next/server";
import { APPLICATION_SLUGS } from "@/lib/apply.config";
import { countAllApplications, countApplicationsByStatus } from "@/lib/applications.db";

export async function GET(req: NextRequest) {
  const roleLevel = req.headers.get("x-role-level");
  if (!roleLevel || roleLevel === "staff") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { status, dept } = Object.fromEntries(req.nextUrl.searchParams);

  if (dept) {
    if (!APPLICATION_SLUGS.includes(dept)) {
      return NextResponse.json({ error: "Invalid department" }, { status: 400 });
    }
    const counts = countApplicationsByStatus(dept);
    return NextResponse.json(counts);
  }

  const summary = countAllApplications();
  return NextResponse.json(summary);
}
