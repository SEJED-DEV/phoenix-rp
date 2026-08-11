const GUILD_ID = process.env.DISCORD_GUILD_ID!;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;

// In-memory caches for expensive Discord reads. Fetching the full member list
// is paginated (1000 per request) and was previously re-done on every page/API
// hit, which made /staff, the staff dashboard, and member search lag badly.
const MEMBER_LIST_CACHE_TTL_MS = 300_000;
const MEMBER_COUNT_CACHE_TTL_MS = 60_000;
const GUILD_ROLES_CACHE_TTL_MS = 60_000;
const RETRY_BACKOFF_MS = 30_000;

let memberListCache: { at: number; members: RawMember[] } | null = null;
let memberListInflight: Promise<RawMember[]> | null = null;
let memberListRetryAt = 0;
let memberCountCache: { at: number; value: number } | null = null;
let guildRolesCache: { at: number; roles: GuildRole[] } | null = null;
let guildRolesInflight: Promise<GuildRole[]> | null = null;
let guildRolesRetryAt = 0;

export const ROLES = {
  WHITELISTED: "1533959429697966233",
  CHECKIN: "1504849769845899284",
  BANNED: "1504840125245554769",
  BLACKLISTED: "1504840125690155191",
  STAFF: "1504840075945443513",
} as const;

export const WHITELIST_INTERVIEW_ROLE = "1504855389223522384";
export const STAFF_INTERVIEW_ROLE = "1509896150591864842";
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
  [ROLES.WHITELISTED]: "🔑 | Whitelisted S2",
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
  username?: string;
  avatar?: string;
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
      username: member.user?.username || undefined,
      avatar: member.user?.avatar || undefined,
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
    const allMembers = await fetchAllMembers();

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

    return staff;
  } catch (e) {
    console.error("[discord] getStaffMembers exception:", e);
    return [];
  }
}

export async function getGuildMemberCount(): Promise<number> {
  if (memberCountCache && Date.now() - memberCountCache.at < MEMBER_COUNT_CACHE_TTL_MS) {
    return memberCountCache.value;
  }
  try {
    const url = `https://discord.com/api/v10/guilds/${GUILD_ID}?with_counts=true`;
    const res = await fetch(url, {
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return 0;
    const data = await res.json();
    const count = data.approximate_member_count ?? 0;
    if (count > 0) memberCountCache = { at: Date.now(), value: count };
    return count;
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

export interface GuildRole {
  id: string;
  name: string;
  color: number;
  position: number;
  managed: boolean;
}

export async function getGuildRoles(): Promise<GuildRole[]> {
  const now = Date.now();
  if (guildRolesCache && now - guildRolesCache.at < GUILD_ROLES_CACHE_TTL_MS) {
    return guildRolesCache.roles;
  }
  if (guildRolesInflight) return guildRolesInflight;
  if (now < guildRolesRetryAt) {
    return guildRolesCache?.roles ?? [];
  }

  guildRolesInflight = (async (): Promise<GuildRole[]> => {
    try {
      const url = `https://discord.com/api/v10/guilds/${GUILD_ID}/roles`;
      const res = await fetch(url, {
        headers: { Authorization: `Bot ${BOT_TOKEN}` },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        guildRolesRetryAt = Date.now() + RETRY_BACKOFF_MS;
        return guildRolesCache?.roles ?? [];
      }
      const roles = (await res.json()) as GuildRole[];
      if (roles.length > 0) {
        guildRolesCache = { at: Date.now(), roles };
      }
      return roles;
    } catch {
      guildRolesRetryAt = Date.now() + RETRY_BACKOFF_MS;
      return guildRolesCache?.roles ?? [];
    } finally {
      guildRolesInflight = null;
    }
  })();

  return guildRolesInflight;
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

interface RawMember {
  roles: string[];
  user: { id: string; username: string; avatar: string };
}

export async function getStaffCount(): Promise<number> {
  try {
    const members = await fetchAllMembers();
    return members.filter((m) => m.user && m.roles.includes(ROLES.STAFF)).length;
  } catch (e) {
    console.error("[discord] getStaffCount exception:", e);
    return 0;
  }
}

async function fetchAllMembers(): Promise<RawMember[]> {
  const now = Date.now();

  // Fresh cache — return instantly, no Discord call.
  if (memberListCache && now - memberListCache.at < MEMBER_LIST_CACHE_TTL_MS) {
    return memberListCache.members;
  }

  // Stale cache — serve it immediately and refresh in the background, so a
  // search never blocks on Discord. Concurrent calls share one refresh.
  if (memberListCache) {
    if (now >= memberListRetryAt && !memberListInflight) {
      memberListInflight = refreshMemberList();
    }
    return memberListCache.members;
  }

  // No cache at all — fetch (coalesced across callers), but back off briefly
  // after a failure so a 429/outage can't trigger a retry on every search.
  if (now < memberListRetryAt) return [];
  if (memberListInflight) return memberListInflight;
  memberListInflight = refreshMemberList();
  return memberListInflight;
}

async function refreshMemberList(): Promise<RawMember[]> {
  try {
    const allMembers: RawMember[] = [];
    let after = "0";

    while (true) {
      const url = `https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=1000&after=${after}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bot ${BOT_TOKEN}` },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        memberListRetryAt = Date.now() + RETRY_BACKOFF_MS;
        return memberListCache?.members ?? allMembers;
      }
      const batch: RawMember[] = await res.json();
      if (batch.length === 0) break;
      allMembers.push(...batch);
      after = batch[batch.length - 1].user.id;
      if (batch.length < 1000) break;
    }

    // Only cache a healthy result — never an empty list (Discord outage).
    if (allMembers.length > 0) {
      memberListCache = { at: Date.now(), members: allMembers };
    }
    return allMembers;
  } catch {
    memberListRetryAt = Date.now() + RETRY_BACKOFF_MS;
    return memberListCache?.members ?? [];
  } finally {
    memberListInflight = null;
  }
}

export interface ForumPost {
  threadId: string;
  name: string;
  forumUrl: string;
  imageUrl: string | null;
  imageName: string | null;
}

interface ForumAttachment {
  url: string;
  filename: string;
  content_type?: string;
}

async function getFirstMessageImage(threadId: string): Promise<{ url: string; name: string } | null> {
  try {
    const url = `https://discord.com/api/v10/channels/${threadId}/messages?limit=1`;
    const res = await fetch(url, {
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
    });
    if (!res.ok) return null;
    const messages = await res.json();
    const first = messages[0];
    if (!first) return null;
    const attachment = (first.attachments || []).find(
      (a: ForumAttachment) => a.content_type?.startsWith("image/")
    );
    if (!attachment) return null;
    return { url: attachment.url, name: attachment.filename };
  } catch {
    return null;
  }
}

/**
 * Pulls every post (thread) from a Discord forum channel — active and archived.
 * Each post includes its name and the first image from its opening message.
 */
export async function getForumPosts(forumChannelId: string): Promise<ForumPost[]> {
  const posts: ForumPost[] = [];
  const seen = new Set<string>();

  const auth = { Authorization: `Bot ${BOT_TOKEN}` };

  // Active threads live on the guild endpoint.
  try {
    const url = `https://discord.com/api/v10/guilds/${GUILD_ID}/threads/active`;
    const res = await fetch(url, { headers: auth });
    if (res.ok) {
      const data = await res.json();
      for (const t of data.threads || []) {
        if (t.parent_id === forumChannelId) {
          seen.add(t.id);
          posts.push({
            threadId: t.id,
            name: t.name || "Untitled",
            forumUrl: `https://discord.com/channels/${GUILD_ID}/${t.id}`,
            imageUrl: null,
            imageName: null,
          });
        }
      }
    }
  } catch {}

  // Archived threads are paged off the channel endpoint.
  let before: string | undefined;
  while (true) {
    try {
      const q = before ? `?before=${before}` : "";
      const url = `https://discord.com/api/v10/channels/${forumChannelId}/threads/archived/public${q}`;
      const res = await fetch(url, { headers: auth });
      if (!res.ok) break;
      const data = await res.json();
      const batch = data.threads || [];
      if (batch.length === 0) break;
      for (const t of batch) {
        if (seen.has(t.id)) continue;
        seen.add(t.id);
        posts.push({
          threadId: t.id,
          name: t.name || "Untitled",
          forumUrl: `https://discord.com/channels/${GUILD_ID}/${t.id}`,
          imageUrl: null,
          imageName: null,
        });
      }
      if (!data.has_more) break;
      before = batch[batch.length - 1].id;
    } catch {
      break;
    }
  }

  // Fetch the opening message image for each post.
  await Promise.all(
    posts.map(async (p) => {
      const img = await getFirstMessageImage(p.threadId);
      if (img) {
        p.imageUrl = img.url;
        p.imageName = img.name;
      }
    })
  );

  return posts;
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
