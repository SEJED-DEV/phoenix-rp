import { NextRequest, NextResponse } from "next/server";
import { getRoleLevel } from "@/lib/permissions";
import { ON_SITE_APPLICATIONS, getApplyConfig } from "@/lib/apply.config";
import {
  getAllEditors,
  canEditQuestions,
  isHighRank,
} from "@/lib/application-questions";
import { getGuildRoles, getUserRoles } from "@/lib/discord";

export async function GET(req: NextRequest) {
  const level = getRoleLevel(req.headers);
  const userId = req.headers.get("x-user-id") || "";

  let roles: string[] = [];
  if (!isHighRank(level)) {
    roles = await getUserRoles(userId);
  }

  const editors = getAllEditors();
  const depts = ON_SITE_APPLICATIONS.map((slug) => ({
    slug,
    label: getApplyConfig(slug)?.label ?? slug,
    editableByMe: isHighRank(level) ? true : canEditQuestions(userId, roles, slug),
  }));

  const guildRoles = await getGuildRoles();
  const roleList = guildRoles
    .filter((r) => r.name)
    .sort((a, b) => b.position - a.position)
    .map((r) => ({ id: r.id, name: r.name }));

  return NextResponse.json({ depts, editors, roles: roleList });
}
