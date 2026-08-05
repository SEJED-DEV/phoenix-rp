import { NextRequest, NextResponse } from "next/server";
import { getRoleLevel } from "@/lib/permissions";
import { getApplyConfig } from "@/lib/apply.config";
import {
  addViewer,
  removeViewer,
  isApplicableSlug,
  isHighRank,
} from "@/lib/application-questions";
import { logStaffAction } from "@/lib/activity-log";

function denied() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const level = getRoleLevel(req.headers);
  if (!isHighRank(level)) return denied();

  const userId = req.headers.get("x-user-id") || "";
  const username = req.headers.get("x-user-name") || "";

  let body: { dept?: string; granteeType?: string; granteeId?: string; granteeName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { dept, granteeType, granteeId, granteeName } = body;
  if (!dept || !isApplicableSlug(dept)) {
    return NextResponse.json({ error: "Invalid department" }, { status: 400 });
  }
  if (granteeType !== "member" && granteeType !== "role") {
    return NextResponse.json({ error: "Invalid grantee type" }, { status: 400 });
  }
  if (!granteeId) {
    return NextResponse.json({ error: "Missing grantee" }, { status: 400 });
  }

  addViewer({
    dept,
    granteeType,
    granteeId,
    granteeName: granteeName || granteeId,
    grantedBy: userId,
    grantedByUser: username,
  });

  logStaffAction({
    actorId: userId,
    actorName: username,
    action: "application_viewer_add",
    targetId: granteeId,
    targetName: granteeName || granteeId,
    metadata: { dept, deptLabel: getApplyConfig(dept)?.label ?? dept, granteeType },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const level = getRoleLevel(req.headers);
  if (!isHighRank(level)) return denied();

  const userId = req.headers.get("x-user-id") || "";
  const username = req.headers.get("x-user-name") || "";

  const dept = req.nextUrl.searchParams.get("dept");
  const granteeType = req.nextUrl.searchParams.get("type");
  const granteeId = req.nextUrl.searchParams.get("id");

  if (!dept || !isApplicableSlug(dept)) {
    return NextResponse.json({ error: "Invalid department" }, { status: 400 });
  }
  if (granteeType !== "member" && granteeType !== "role") {
    return NextResponse.json({ error: "Invalid grantee type" }, { status: 400 });
  }
  if (!granteeId) {
    return NextResponse.json({ error: "Missing grantee" }, { status: 400 });
  }

  removeViewer(dept, granteeType, granteeId);

  logStaffAction({
    actorId: userId,
    actorName: username,
    action: "application_viewer_remove",
    targetId: granteeId,
    metadata: { dept, deptLabel: getApplyConfig(dept)?.label ?? dept, granteeType },
  });

  return NextResponse.json({ success: true });
}
