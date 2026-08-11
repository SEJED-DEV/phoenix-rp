import { NextRequest, NextResponse } from "next/server";
import { APPLICATION_SLUGS } from "@/lib/apply.config";
import { getApplicationById, updateApplication } from "@/lib/applications.db";
import { getLabelsForDept } from "@/lib/application-questions";
import { getRoleLevel, getUserRolesFromHeaders } from "@/lib/permissions";
import { canViewApplications, canApproveApplications, isHighRank } from "@/lib/application-questions";
import { logStaffAction } from "@/lib/activity-log";
import { notifyApplicationResult, notifyWhitelistResult } from "@/lib/application-notify";
import {
  addRole,
  WHITELIST_INTERVIEW_ROLE,
  STAFF_INTERVIEW_ROLE,
  getMemberInfo,
  isMemberInGuild,
  getGuildRoles,
  getHighestRole,
  PUNISHMENT_ROLES,
} from "@/lib/discord";
import { getProfileRoles } from "@/lib/profile-roles.config";
import { getDepartmentsForMember } from "@/lib/departments.config";
import { getSiteUrl } from "@/lib/site-url";

export async function GET(req: NextRequest, { params }: { params: Promise<{ dept: string; id: string }> }) {
  const roleLevel = getRoleLevel(req.headers);
  const { dept, id } = await params;

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

  const application = getApplicationById(dept, parseInt(id, 10));
  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const labels = getLabelsForDept(dept);

  const [memberInfo, inGuild, guildRoles] = await Promise.all([
    getMemberInfo(application.discordId),
    isMemberInGuild(application.discordId),
    getGuildRoles(),
  ]);

  const roles = memberInfo?.roles ?? [];

  const roleMap = new Map<string, { name: string; color: string; position: number }>();
  for (const r of guildRoles) {
    roleMap.set(r.id, {
      name: r.name,
      color: r.color ? `#${r.color.toString(16).padStart(6, "0")}` : "#9ca3af",
      position: r.position,
    });
  }

  const mappedRoles = roles
    .map((rid) => {
      const r = roleMap.get(rid);
      return { id: rid, name: r?.name ?? rid, color: r?.color ?? "#9ca3af", position: r?.position ?? -1 };
    })
    .sort((a, b) => b.position - a.position)
    .map(({ position: _position, ...rest }) => rest);

  const avatar = memberInfo?.avatar
    ? `https://cdn.discordapp.com/avatars/${application.discordId}/${memberInfo.avatar}.png?size=128`
    : `https://cdn.discordapp.com/embed/avatars/${Number(application.discordId.slice(-1) || "0") % 5}.png`;

  return NextResponse.json({
    application,
    labels,
    canReview: canApproveApplications(
      req.headers.get("x-user-id") || "",
      getUserRolesFromHeaders(req.headers),
      roleLevel,
      dept
    ),
    profile: {
      username: memberInfo?.username || application.username,
      avatar,
      joinedAt: memberInfo?.joinedAt || null,
      inGuild,
      highestRole: getHighestRole(roles),
      roles: mappedRoles,
      curatedRoles: getProfileRoles(roles),
      departments: getDepartmentsForMember(roles),
      punishments: PUNISHMENT_ROLES.filter((p) => roles.includes(p.id)),
    },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ dept: string; id: string }> }) {
  const { dept, id } = await params;
  if (!APPLICATION_SLUGS.includes(dept)) {
    return NextResponse.json({ error: "Invalid department" }, { status: 400 });
  }

  const roleLevel = getRoleLevel(req.headers);
  const actorId = req.headers.get("x-user-id") || "";
  const actorRoles = getUserRolesFromHeaders(req.headers);
  if (!canApproveApplications(actorId, actorRoles, roleLevel, dept)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  let roleGranted: boolean | null = null;
  if (dept === "whitelist" && body.status === "approved") {
    roleGranted = await addRole(application.discordId, WHITELIST_INTERVIEW_ROLE);
    if (!roleGranted) {
      console.error(`[whitelist] Failed to grant interview role ${WHITELIST_INTERVIEW_ROLE} to ${application.discordId}`);
    }
  } else if (dept.startsWith("staff_") && body.status === "approved") {
    roleGranted = await addRole(application.discordId, STAFF_INTERVIEW_ROLE);
    if (!roleGranted) {
      console.error(`[staff] Failed to grant interview role ${STAFF_INTERVIEW_ROLE} to ${application.discordId}`);
    }
  }

  logStaffAction({
    actorId,
    actorName,
    action: body.status === "approved" ? "application_approve" : "application_deny",
    targetId: application.discordId,
    targetName: application.username,
    reason: body.reviewNote,
    metadata: { department: dept, applicationId: application.id, roleGranted },
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
    getSiteUrl(),
  );

  if (dept === "whitelist") {
    await notifyWhitelistResult(
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
      getSiteUrl(),
    );
  }

  return NextResponse.json({ success: true, roleGranted });
}
