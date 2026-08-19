import { Client, GatewayIntentBits, type GuildMember, type PartialGuildMember } from "discord.js";
import { initConsoleRelay } from "@/lib/console-relay";
import crypto from "crypto";

initConsoleRelay("bot");

const token = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!token) {
  console.error("Missing DISCORD_BOT_TOKEN in .env.local");
  process.exit(1);
}

// Punishment roles — must match src/lib/discord.ts PUNISHMENT_ROLES
const PUNISHMENT_ROLES = [
  { id: "1504840115263115375", name: "Warn 1", severity: 1 },
  { id: "1504840113467953173", name: "Warn 2", severity: 2 },
  { id: "1504840114503811122", name: "Warn 3", severity: 3 },
  { id: "1504840124251242578", name: "Staff Warn 2", severity: 4 },
  { id: "1504840122850345042", name: "Staff Warn 3", severity: 5 },
  { id: "1504840125245554769", name: "Banned", severity: 6 },
  { id: "1504840125690155191", name: "Blacklisted", severity: 7 },
];

const PUNISHMENT_ROLE_IDS = new Set(PUNISHMENT_ROLES.map((r) => r.id));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("clientReady", () => {
  console.log(`Bot logged in as ${client.user?.tag}`);
  client.user?.setPresence({
    status: "dnd",
    activities: [{ name: "Tunisian Phoenix RP", type: 4 }],
  });
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  if (message.content === "!ping") {
    message.reply("Pong!");
  }
});

// Track members who leave with active punishment roles
client.on("guildMemberRemove", async (member: GuildMember | PartialGuildMember) => {
  try {
    if (!member.partial && member.user.bot) return;
    if (GUILD_ID && member.guild.id !== GUILD_ID) return;

    // Fetch full member data if partial (needed for roles cache)
    const fullMember = member.partial ? await member.fetch() : member;
    if (!("roles" in fullMember)) return;

    const memberRoleIds = fullMember.roles.cache.map((r) => r.id);
    const heldPunishments = PUNISHMENT_ROLES.filter((pr) => memberRoleIds.includes(pr.id));

    if (heldPunishments.length === 0) return;

    // Import DB lazily — only needed when someone with sanctions leaves
    const { getDb } = await import("@/lib/db");
    const db = getDb();

    const allRoleNames = fullMember.roles.cache
      .filter((r) => r.id !== member.guild.id)
      .map((r) => r.name);

    db.prepare(`
      INSERT OR REPLACE INTO departed_members (id, userId, username, displayName, avatar, punishmentRoles, allRoles, leftAt, rejoined)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      crypto.randomUUID(),
      member.id,
      member.user.username,
      ("displayName" in fullMember ? fullMember.displayName : null) || member.user.username,
      member.user.displayAvatarURL() || "",
      JSON.stringify(heldPunishments.map((p) => ({ id: p.id, name: p.name, severity: p.severity }))),
      JSON.stringify(allRoleNames),
      new Date().toISOString(),
    );

    console.log(`[bot] Tracked departed member ${member.user.username} (${member.id}) with ${heldPunishments.length} punishment role(s): ${heldPunishments.map((p) => p.name).join(", ")}`);
  } catch (err) {
    console.error("[bot] Error tracking departed member:", err);
  }
});

// When a member rejoins, mark them as rejoined
client.on("guildMemberAdd", async (member: GuildMember | PartialGuildMember) => {
  try {
    if (member.partial) return;
    if (GUILD_ID && member.guild.id !== GUILD_ID) return;

    const { getDb } = await import("@/lib/db");
    const db = getDb();

    const existing = db.prepare("SELECT id FROM departed_members WHERE userId = ? AND rejoined = 0").get(member.id) as { id: string } | undefined;
    if (existing) {
      db.prepare("UPDATE departed_members SET rejoined = 1 WHERE id = ?").run(existing.id);
      console.log(`[bot] Marked ${member.user.username} (${member.id}) as rejoined`);
    }
  } catch (err) {
    console.error("[bot] Error marking rejoin:", err);
  }
});

client.login(token);
