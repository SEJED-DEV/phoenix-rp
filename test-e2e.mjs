import fs from "fs";
import path from "path";
import { SignJWT } from "jose";
import Database from "better-sqlite3";

const env = fs.readFileSync(".env.local", "utf8");
const get = (k) => {
  const l = env.split(/\r?\n/).find((x) => x.startsWith(k + "="));
  return l ? l.split("=").slice(1).join("=") : "";
};
const SECRET = new TextEncoder().encode(get("SESSION_SECRET"));
const BASE = "http://localhost:3000";

async function tokenFor(userId, username, roles) {
  return await new SignJWT({ userId, username, avatar: "abc", roles, isStaff: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

const staffToken = await tokenFor("300796750757756935", "stormshadow1212", ["1504840075945443513"]);
const ownerToken = await tokenFor("1373452327985479722", "owner-e2e", ["985444871722631199", "1504840075945443513"]);
const staffCookie = { Cookie: `phoenix_session=${staffToken}` };
const ownerCookie = { Cookie: `phoenix_session=${ownerToken}` };

// 1. Submit a police application
let appId = null;
let res = await fetch(`${BASE}/api/apply/police`, {
  method: "POST",
  headers: { ...staffCookie, "Content-Type": "application/json" },
  body: JSON.stringify({ realName: "E2E Test", age: 21, discordTag: "stormshadow1212", whyPD: "e2e test", characterConcept: "e2e", availableHours: "10h" }),
});
console.log("apply POST ->", res.status);
if (res.status === 201) {
  appId = (await res.json()).id;
  console.log("created app id:", appId);
} else {
  console.log("apply body:", await res.text());
}

// If 409 (pending already exists), reuse the latest pending app
if (!appId) {
  const db = new Database(path.join(process.cwd(), "data", "tickets.db"));
  const row = db.prepare("SELECT id FROM applications_police WHERE discordId = ? AND status = 'pending' ORDER BY id DESC LIMIT 1").get("300796750757756935");
  appId = row?.id;
  db.close();
  console.log("reused existing pending app id:", appId);
}

// 2. Approve it as management
if (appId) {
  res = await fetch(`${BASE}/api/staff/applications/police/${appId}`, {
    method: "PATCH",
    headers: { ...ownerCookie, "Content-Type": "application/json" },
    body: JSON.stringify({ status: "approved", reviewNote: "E2E approval test" }),
  });
  console.log("approve PATCH ->", res.status, await res.text());
}

// 3. Create a ticket (try types until one isn't blocked)
for (const type of ["bug-report", "complaint", "general", "refund"]) {
  res = await fetch(`${BASE}/api/tickets`, {
    method: "POST",
    headers: { ...staffCookie, "Content-Type": "application/json" },
    body: JSON.stringify({ type, subject: "E2E ticket test", description: "test ticket notification" }),
  });
  console.log(`ticket POST (${type}) ->`, res.status);
  if (res.status === 201) break;
}

// 4. Verify Discord containers
const bot = get("DISCORD_BOT_TOKEN");
for (const [label, ch] of [["apps", "1533516939773612283"], ["tickets", "1504944704888766644"]]) {
  const r = await fetch(`https://discord.com/api/v10/channels/${ch}/messages?limit=5`, {
    headers: { Authorization: `Bot ${bot}` },
  });
  const msgs = await r.json();
  console.log(`\n--- ${label} latest ${msgs.length} message(s) ---`);
  for (const m of msgs.slice(0, 3)) {
    console.log(JSON.stringify({ flags: m.flags, components: m.components }, null, 1).slice(0, 1200));
  }
}
