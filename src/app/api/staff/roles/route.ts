import { NextRequest, NextResponse } from "next/server";
import { ContainerBuilder, TextDisplayBuilder } from "@discordjs/builders";
import {
  addRole,
  removeRole,
  getGuildRoles,
  isMemberInGuild,
  sendContainer,
} from "@/lib/discord";
import { getUserRolesFromHeaders } from "@/lib/permissions";
import { logStaffAction } from "@/lib/activity-log";

const GUILD_ID = process.env.DISCORD_GUILD_ID || "";
const ROLE_LOG_CHANNEL = "1536726437371969596";

interface GuildRole {
  id: string;
  name: string;
  color: number;
  position: number;
  managed: boolean;
}

function colorHex(color: number): string {
  if (!color) return "#9ca3af";
  return `#${(color >>> 0).toString(16).padStart(6, "0")}`;
}

async function getActorAndRoles(req: NextRequest): Promise<{ actorId: string; actorName: string; actorRoles: string[]; guild: GuildRole[] }> {
  const actorId = req.headers.get("x-user-id") || "";
  const actorName = req.headers.get("x-user-name") || "";
  const actorRoles = getUserRolesFromHeaders(req.headers);
  const guild = (await getGuildRoles()) as GuildRole[];
  return { actorId, actorName, actorRoles, guild };
}

function getActorHighest(actorRoles: string[], guild: GuildRole[]): GuildRole | null {
  let highest: GuildRole | null = null;
  for (const r of guild) {
    if (actorRoles.includes(r.id) && (!highest || r.position > highest.position)) {
      highest = r;
    }
  }
  return highest;
}

function getManageable(actorRoles: string[], guild: GuildRole[]): GuildRole[] {
  const highest = getActorHighest(actorRoles, guild);
  if (!highest) return [];
  return guild
    .filter((r) => r.position < highest.position && r.id !== GUILD_ID && !r.managed)
    .sort((a, b) => b.position - a.position);
}

export async function GET(req: NextRequest) {
  const { actorRoles, guild } = await getActorAndRoles(req);
  const highest = getActorHighest(actorRoles, guild);

  const roleNames: Record<string, string> = {};
  for (const r of guild) roleNames[r.id] = r.name;

  const manageable = getManageable(actorRoles, guild).map((r) => ({
    id: r.id,
    name: r.name,
    color: colorHex(r.color),
    position: r.position,
  }));

  return NextResponse.json({
    manageable,
    actorHighest: highest ? { id: highest.id, name: highest.name, position: highest.position } : null,
    roleNames,
  });
}

export async function POST(req: NextRequest) {
  const { actorId, actorName, actorRoles, guild } = await getActorAndRoles(req);
  if (!actorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { targetId?: string; targetName?: string; roleId?: string; action?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { targetId, targetName, roleId, reason } = body;
  const action = body.action;

  if (!targetId || !roleId || !action || !["add", "remove"].includes(action)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const role = guild.find((r) => r.id === roleId);
  if (!role) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  if (role.id === GUILD_ID || role.managed) {
    return NextResponse.json({ error: "This role cannot be managed" }, { status: 400 });
  }

  const highest = getActorHighest(actorRoles, guild);
  if (!highest) {
    return NextResponse.json({ error: "No role found for your account" }, { status: 403 });
  }
  if (role.position >= highest.position) {
    return NextResponse.json(
      { error: `You cannot manage roles at or above your highest role (${highest.name})` },
      { status: 403 }
    );
  }

  const inGuild = await isMemberInGuild(targetId);
  if (inGuild === false) {
    return NextResponse.json({ error: "Target is not in the server" }, { status: 400 });
  }

  const success = action === "add" ? await addRole(targetId, roleId) : await removeRole(targetId, roleId);
  if (!success) {
    return NextResponse.json({ error: "Failed to update role on Discord" }, { status: 500 });
  }

  logStaffAction({
    actorId,
    actorName,
    action: action === "add" ? "role_grant" : "role_revoke",
    targetId,
    targetName: targetName || targetId,
    reason,
    metadata: { roleId, roleName: role.name, action },
  });

  const container = new ContainerBuilder()
    .setAccentColor(action === "add" ? 0x34d399 : 0xf87171)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          `**${action === "add" ? "Role Granted" : "Role Revoked"}**`,
          `**Target:** <@${targetId}>${targetName ? ` (${targetName})` : ""}`,
          `**Role:** ${role.name}`,
          `**Staff:** <@${actorId}>`,
          reason ? `**Reason:** ${reason}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
      ),
    );

  await sendContainer(ROLE_LOG_CHANNEL, [container.toJSON()]);

  return NextResponse.json({ success: true, roleName: role.name, action });
}
