import { NextRequest, NextResponse } from "next/server";
import { getMemberInfo, getHighestRole } from "@/lib/discord";
import { getDb } from "@/lib/db";
import { getProfileRoles, CREATOR_ID } from "@/lib/profile-roles.config";
import { getDepartmentsForMember } from "@/lib/departments.config";

const GUILD_ID = process.env.DISCORD_GUILD_ID!;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;

async function fetchDiscordUser(userId: string): Promise<{ username: string; avatar: string } | null> {
  try {
    const res = await fetch(`https://discord.com/api/v10/users/${userId}`, {
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
    });
    if (!res.ok) return null;
    const user = await res.json();
    const avatar = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.id) % 5}.png`;
    return { username: user.username, avatar };
  } catch {
    return null;
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  // Try DB first for username/avatar (faster, no extra API call)
  const ticketRow = db
    .prepare("SELECT username, avatar FROM tickets WHERE userId = ? ORDER BY createdAt DESC LIMIT 1")
    .get(id) as { username: string; avatar: string } | undefined;

  const msgRow = !ticketRow
    ? db
        .prepare("SELECT username, avatar FROM ticket_messages WHERE userId = ? ORDER BY createdAt DESC LIMIT 1")
        .get(id) as { username: string; avatar: string } | undefined
    : null;

  let username: string;
  let avatar: string;

  if (ticketRow) {
    username = ticketRow.username;
    avatar = ticketRow.avatar;
  } else if (msgRow) {
    username = msgRow.username;
    avatar = msgRow.avatar;
  } else {
    // Not in DB — fetch from Discord API
    const discordUser = await fetchDiscordUser(id);
    if (!discordUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    username = discordUser.username;
    avatar = discordUser.avatar;
  }

  const memberInfo = await getMemberInfo(id);
  const discordRoles = memberInfo?.roles ?? [];
  const joinedAt = memberInfo?.joinedAt ?? null;
  const highestRole = getHighestRole(discordRoles);

  const profileRoles = getProfileRoles(discordRoles);
  const departments = getDepartmentsForMember(discordRoles);

  const totalTickets = (db.prepare("SELECT COUNT(*) as c FROM tickets WHERE userId = ?").get(id) as { c: number }).c;
  const openTickets = (db.prepare("SELECT COUNT(*) as c FROM tickets WHERE userId = ? AND status = 'open'").get(id) as { c: number }).c;
  const inProgressTickets = (db.prepare("SELECT COUNT(*) as c FROM tickets WHERE userId = ? AND status = 'in-progress'").get(id) as { c: number }).c;
  const closedTickets = (db.prepare("SELECT COUNT(*) as c FROM tickets WHERE userId = ? AND status = 'closed'").get(id) as { c: number }).c;

  return NextResponse.json({
    username,
    avatar,
    highestRole,
    joinedAt,
    isCreator: id === CREATOR_ID,
    profileRoles,
    departments,
    stats: {
      totalTickets,
      openTickets,
      inProgressTickets,
      closedTickets,
    },
  });
}
