const GUILD_ID = process.env.DISCORD_GUILD_ID!;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;

export const ROLES = {
  WHITELISTED: "1504840081926525069",
  CHECKIN: "1504849769845899284",
  BANNED: "1504840125245554769",
  BLACKLISTED: "1504840125690155191",
  STAFF: "1504840075945443513",
} as const;

export const PUNISHMENT_ROLES = [
  { id: "1504840115263115375", name: "Warn 1", color: "#f87171", severity: 1 },
  { id: "1504840113467953173", name: "Warn 2", color: "#ef4444", severity: 2 },
  { id: "1504840114503811122", name: "Warn 3", color: "#dc2626", severity: 3 },
  { id: "1504840124251242578", name: "Staff Warn 2", color: "#b91c1c", severity: 4 },
  { id: "1504840122850345042", name: "Staff Warn 3", color: "#991b1b", severity: 5 },
  { id: "1504840125245554769", name: "Banned", color: "#dc2626", severity: 6 },
  { id: "1504840125690155191", name: "Blacklisted", color: "#7f1d1d", severity: 7 },
];

export const ROLE_NAMES: Record<string, string> = {
  [ROLES.STAFF]: "Staff",
  [ROLES.WHITELISTED]: "Whitelisted",
  [ROLES.CHECKIN]: "Check-in",
  [ROLES.BANNED]: "Banned",
  [ROLES.BLACKLISTED]: "Blacklisted",
};

// Priority order — first match wins
const ROLE_PRIORITY = [ROLES.STAFF, ROLES.WHITELISTED, ROLES.CHECKIN, ROLES.BLACKLISTED, ROLES.BANNED];

export function getHighestRole(userRoles: string[]): string | null {
  for (const r of ROLE_PRIORITY) {
    if (userRoles.includes(r)) return ROLE_NAMES[r];
  }
  return null;
}

export interface MemberInfo {
  roles: string[];
  joinedAt: string;
}

async function fetchMember(userId: string): Promise<MemberInfo | null> {
  try {
    const url = `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}`;
    console.log(`[discord] Fetching member info for user ${userId}`);
    const res = await fetch(url, {
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[discord] fetchMember failed: ${res.status} — ${body}`);
      return null;
    }
    const member = await res.json();
    const data: MemberInfo = {
      roles: member.roles || [],
      joinedAt: member.joined_at || "",
    };
    console.log(`[discord] Member info for ${userId}:`, data);
    return data;
  } catch (e) {
    console.error("[discord] fetchMember exception:", e);
    return null;
  }
}

export async function getMemberInfo(userId: string): Promise<MemberInfo | null> {
  return fetchMember(userId);
}

export async function getUserRoles(userId: string): Promise<string[]> {
  const info = await getMemberInfo(userId);
  return info?.roles ?? [];
}

/**
 * Returns whether the user is currently a member of the guild.
 * `false` means the member is not in the guild (Discord 404); `null`
 * means the Discord API call failed, distinct from a real absence.
 */
export async function isMemberInGuild(userId: string): Promise<boolean | null> {
  try {
    const url = `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
    });
    if (res.status === 404) return false;
    if (!res.ok) return null;
    return true;
  } catch {
    return null;
  }
}

export interface StaffMember {
  userId: string;
  username: string;
  avatar: string;
  roles: string[];
}

const STAFF_ROLE_IDS = [
  "985444871722631199", // Creator
  "1471841519970287789", // Founder
  "1504840040424018123", // Owner
  "1504840052654735390", // Server Supervisor
  "1504840056333144246", // Server Manager
  "1504840058174443582", // Discord Manager
  "1504850103154901014", // Admin Supervisor
  "1504840067498250383", // Admin
  "1504840068798480618", // Admin Under Test
  "1505998312669446144", // Media Manager
  "1504850107848331365", // Whitelist Supervisor
  "1504840075945443513", // Staff Team
  "1504840072267038721", // Support Team
  "1504840060233842739", // Whitelister
  "1504840074377035927", // PC Checker
  "1507135880824094751", // Developer
];

export async function getStaffMembers(): Promise<StaffMember[]> {
  try {
    console.log("[discord] Fetching guild members for staff page");
    let allMembers: { roles: string[]; user: { id: string; username: string; avatar: string } }[] = [];
    let after = "0";

    while (true) {
      const url = `https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=1000&after=${after}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bot ${BOT_TOKEN}` },
      });
      if (!res.ok) {
        const body = await res.text();
        console.error(`[discord] getStaffMembers failed: ${res.status} — ${body}`);
        break;
      }
      const batch = await res.json();
      if (batch.length === 0) break;
      allMembers = allMembers.concat(batch);
      after = batch[batch.length - 1].user.id;
      if (batch.length < 1000) break;
    }

    console.log(`[discord] Fetched ${allMembers.length} total members`);

    const staff: StaffMember[] = allMembers
      .filter((m) => {
        if (!m.user) return false;
        return m.roles.some((r) => STAFF_ROLE_IDS.includes(r));
      })
      .map((m) => ({
        userId: m.user.id,
        username: m.user.username,
        avatar: m.user.avatar
          ? `https://cdn.discordapp.com/avatars/${m.user.id}/${m.user.avatar}.png?size=128`
          : `https://cdn.discordapp.com/embed/avatars/${parseInt(m.user.id) % 5}.png`,
        roles: m.roles.filter((r) => STAFF_ROLE_IDS.includes(r)),
      }))
      .sort((a: StaffMember, b: StaffMember) => {
        const aHighest = STAFF_ROLE_IDS.findIndex((r) => a.roles.includes(r));
        const bHighest = STAFF_ROLE_IDS.findIndex((r) => b.roles.includes(r));
        return aHighest - bHighest;
      });

    console.log(`[discord] Found ${staff.length} staff members`);
    return staff;
  } catch (e) {
    console.error("[discord] getStaffMembers exception:", e);
    return [];
  }
}

export async function getGuildMemberCount(): Promise<number> {
  try {
    const url = `https://discord.com/api/v10/guilds/${GUILD_ID}?with_counts=true`;
    const res = await fetch(url, {
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.approximate_member_count ?? 0;
  } catch {
    return 0;
  }
}

export async function kickMember(userId: string, reason?: string): Promise<boolean> {
  try {
    const url = `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function banMember(userId: string, reason?: string, deleteDays = 0): Promise<boolean> {
  try {
    const url = `https://discord.com/api/v10/guilds/${GUILD_ID}/bans/${userId}`;
    const body: Record<string, unknown> = { delete_message_days: deleteDays };
    if (reason) body.reason = reason;
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function unbanMember(userId: string): Promise<boolean> {
  try {
    const url = `https://discord.com/api/v10/guilds/${GUILD_ID}/bans/${userId}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function addRole(userId: string, roleId: string): Promise<boolean> {
  try {
    const url = `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}/roles/${roleId}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function removeRole(userId: string, roleId: string): Promise<boolean> {
  try {
    const url = `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}/roles/${roleId}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getGuildRoles(): Promise<{ id: string; name: string; color: number; position: number }[]> {
  try {
    const url = `https://discord.com/api/v10/guilds/${GUILD_ID}/roles`;
    const res = await fetch(url, {
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function sendMessage(channelId: string, content: string): Promise<boolean> {
  try {
    const url = `https://discord.com/api/v10/channels/${channelId}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function sendEmbed(channelId: string, embed: Record<string, unknown>): Promise<boolean> {
  try {
    const url = `https://discord.com/api/v10/channels/${channelId}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ embeds: [embed] }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function openDm(userId: string): Promise<string | null> {
  try {
    const url = "https://discord.com/api/v10/users/@me/channels";
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recipient_id: userId }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[discord] openDm failed for ${userId}: ${res.status} — ${body}`);
      return null;
    }
    const data = await res.json();
    return data.id as string;
  } catch (e) {
    console.error("[discord] openDm exception:", e);
    return null;
  }
}

// Message Components v2 ("Container") — requires flags 1 << 15 (IsComponentsV2).
// Pass components produced by discord.js builders (e.g. ContainerBuilder#toJSON()).
const IS_COMPONENTS_V2 = 1 << 15;

export async function sendContainer(channelId: string, components: unknown[]): Promise<boolean> {
  try {
    const url = `https://discord.com/api/v10/channels/${channelId}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ components, flags: IS_COMPONENTS_V2 }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[discord] sendContainer failed: ${res.status} — ${body}`);
    }
    return res.ok;
  } catch (e) {
    console.error("[discord] sendContainer exception:", e);
    return false;
  }
}

export async function sendDmContainer(userId: string, components: unknown[]): Promise<boolean> {
  const dmId = await openDm(userId);
  if (!dmId) return false;
  return sendContainer(dmId, components);
}

interface StaffWithPresence {
  userId: string;
  username: string;
  avatar: string;
  roles: string[];
  online: boolean;
}

export async function getStaffWithPresence(): Promise<StaffWithPresence[]> {
  try {
    console.log("[discord] Fetching staff with presence");
    let allMembers: {
      roles: string[];
      user: { id: string; username: string; avatar: string };
      presence?: { status: string };
    }[] = [];
    let after = "0";

    while (true) {
      const url = `https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=1000&after=${after}&with_counts=true`;
      const res = await fetch(url, {
        headers: { Authorization: `Bot ${BOT_TOKEN}` },
      });
      if (!res.ok) break;
      const batch = await res.json();
      if (batch.length === 0) break;
      allMembers = allMembers.concat(batch);
      after = batch[batch.length - 1].user.id;
      if (batch.length < 1000) break;
    }

    const staff: StaffWithPresence[] = allMembers
      .filter((m) => {
        if (!m.user) return false;
        return m.roles.includes(ROLES.STAFF);
      })
      .map((m) => ({
        userId: m.user.id,
        username: m.user.username,
        avatar: m.user.avatar
          ? `https://cdn.discordapp.com/avatars/${m.user.id}/${m.user.avatar}.png?size=128`
          : `https://cdn.discordapp.com/embed/avatars/${parseInt(m.user.id) % 5}.png`,
        roles: m.roles,
        online: m.presence?.status === "online" || m.presence?.status === "idle" || m.presence?.status === "dnd",
      }));

    console.log(`[discord] Staff with presence: ${staff.length} total, ${staff.filter((s) => s.online).length} online`);
    return staff;
  } catch (e) {
    console.error("[discord] getStaffWithPresence exception:", e);
    return [];
  }
}

interface RawMember {
  roles: string[];
  user: { id: string; username: string; avatar: string };
  presence?: { status: string };
}

async function fetchAllMembers(): Promise<RawMember[]> {
  let allMembers: RawMember[] = [];
  let after = "0";

  while (true) {
    const url = `https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=1000&after=${after}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
    });
    if (!res.ok) break;
    const batch: RawMember[] = await res.json();
    if (batch.length === 0) break;
    allMembers = allMembers.concat(batch);
    after = batch[batch.length - 1].user.id;
    if (batch.length < 1000) break;
  }

  return allMembers;
}

export async function searchMembers(query: string): Promise<{ userId: string; username: string; avatar: string; roles: string[] }[]> {
  try {
    const allMembers = await fetchAllMembers();
    const q = query.toLowerCase();
    return allMembers
      .filter((m) => m.user && m.user.username.toLowerCase().includes(q))
      .slice(0, 20)
      .map((m) => ({
        userId: m.user.id,
        username: m.user.username,
        avatar: m.user.avatar
          ? `https://cdn.discordapp.com/avatars/${m.user.id}/${m.user.avatar}.png?size=128`
          : `https://cdn.discordapp.com/embed/avatars/${parseInt(m.user.id) % 5}.png`,
        roles: m.roles,
      }));
  } catch {
    return [];
  }
}
