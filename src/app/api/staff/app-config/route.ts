import { NextRequest, NextResponse } from "next/server";
import { getRoleLevel, getUserRolesFromHeaders } from "@/lib/permissions";
import { ON_SITE_APPLICATIONS, getApplyConfig } from "@/lib/apply.config";
import {
  getAllEditors,
  getAllViewers,
  getAllApprovers,
  canEditQuestions,
  isHighRank,
} from "@/lib/application-questions";
import { getGuildRoles } from "@/lib/discord";
import { isSiteAppearanceOwner } from "@/lib/site-appearance-access";
import { canEditSiteScope } from "@/lib/site-config-access";
import { canEditStreamers } from "@/lib/streamers-access";

export async function GET(req: NextRequest) {
  const level = getRoleLevel(req.headers);
  const userId = req.headers.get("x-user-id") || "";
  const isAdmin = isHighRank(level);

  let roles: string[] = [];
  if (!isAdmin) {
    roles = getUserRolesFromHeaders(req.headers);
  }

  const isOwner = await isSiteAppearanceOwner(userId);
  const userRoles = getUserRolesFromHeaders(req.headers);
  const canEditLinks = isOwner || canEditSiteScope(userId, userRoles, "links");
  const canEditContent = isOwner || canEditSiteScope(userId, userRoles, "content");
  const canEditGallery = isOwner || canEditSiteScope(userId, userRoles, "gallery");
  const canEditStreamersFlag = isOwner || (await canEditStreamers(userId, userRoles));

  const editors = getAllEditors();
  const viewers = getAllViewers();
  const approvers = getAllApprovers();
  const depts = ON_SITE_APPLICATIONS.map((slug) => ({
    slug,
    label: getApplyConfig(slug)?.label ?? slug,
    editableByMe: isAdmin ? true : canEditQuestions(userId, roles, slug),
  }));

  const guildRoles = await getGuildRoles();
  const roleList = guildRoles
    .filter((r) => r.name)
    .sort((a, b) => b.position - a.position)
    .map((r) => ({ id: r.id, name: r.name }));

  return NextResponse.json({ depts, editors, viewers, approvers, roles: roleList, isHighRank: isAdmin, isSiteOwner: isOwner, canEditLinks, canEditContent, canEditGallery, canEditStreamers: canEditStreamersFlag });
}
