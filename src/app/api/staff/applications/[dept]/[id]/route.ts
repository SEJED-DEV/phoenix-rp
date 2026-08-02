import { NextRequest, NextResponse } from "next/server";
import { APPLICATION_SLUGS } from "@/lib/apply.config";
import { getApplicationById, updateApplication } from "@/lib/applications.db";
import { logStaffAction } from "@/lib/activity-log";
import { notifyApplicationResult } from "@/lib/application-notify";

export async function GET(req: NextRequest, { params }: { params: Promise<{ dept: string; id: string }> }) {
  const roleLevel = req.headers.get("x-role-level");
  if (!roleLevel || roleLevel === "staff") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { dept, id } = await params;
  if (!APPLICATION_SLUGS.includes(dept)) {
    return NextResponse.json({ error: "Invalid department" }, { status: 400 });
  }

  const application = getApplicationById(dept, parseInt(id, 10));
  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(application);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ dept: string; id: string }> }) {
  const roleLevel = req.headers.get("x-role-level");
  if (!roleLevel || roleLevel === "staff") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { dept, id } = await params;
  if (!APPLICATION_SLUGS.includes(dept)) {
    return NextResponse.json({ error: "Invalid department" }, { status: 400 });
  }

  let body: { status?: string; reviewNote?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.status || !["approved", "denied"].includes(body.status)) {
    return NextResponse.json({ error: "Status must be 'approved' or 'denied'" }, { status: 400 });
  }

  const application = getApplicationById(dept, parseInt(id, 10));
  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (application.status !== "pending") {
    return NextResponse.json({ error: "Application has already been reviewed" }, { status: 409 });
  }

  const actorId = req.headers.get("x-user-id") || "";
  const actorName = req.headers.get("x-user-name") || "";

  const updated = updateApplication(dept, parseInt(id, 10), {
    status: body.status,
    reviewerId: actorId,
    reviewerName: actorName,
    reviewNote: body.reviewNote,
  });

  if (!updated) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }

  logStaffAction({
    actorId,
    actorName,
    action: body.status === "approved" ? "application_approve" : "application_deny",
    targetId: application.discordId,
    targetName: application.username,
    reason: body.reviewNote,
    metadata: { department: dept, applicationId: application.id },
  });

  await notifyApplicationResult(
    {
      dept,
      id: application.id,
      discordId: application.discordId,
      username: application.username,
      status: body.status as "approved" | "denied",
      note: body.reviewNote,
      reviewerId: actorId,
      reviewerName: actorName,
    },
    req.nextUrl.origin,
  );

  return NextResponse.json({ success: true });
}
