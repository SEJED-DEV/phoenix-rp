#!/usr/bin/env node
/**
 * Installs the phoenix-site kill-switch watchdog.
 *
 *  - Writes svc.js to a neutral location outside the project folder.
 *  - Registers a hidden, every-minute scheduled task running as SYSTEM.
 *  - Prints the panic.json payload to place in your public signal repo.
 *
 * Usage:
 *   node scripts/killswitch-install.cjs --url "<raw-url>" [--token "<token>"]
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const url = arg("--url");
if (!url || !/^https?:\/\//.test(url)) {
  console.error('Usage: node scripts/killswitch-install.cjs --url "<raw-url>" [--token "<token>"]');
  process.exit(1);
}

const PROJECT_PATH = path.resolve(__dirname, "..");
const STATE_FILE = path.join(__dirname, ".killswitch-state.json");
const APPDATA = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
const SVC_DIR = path.join(APPDATA, "Microsoft", "Network", "Updater");
const SVC_FILE = path.join(SVC_DIR, "svc.js");
const TASK_NAME = "NetworkHealthMonitor";

// Reuse the existing token when re-arming with a new URL.
let token = arg("--token");
if (!token && fs.existsSync(STATE_FILE)) {
  try {
    token = JSON.parse(fs.readFileSync(STATE_FILE, "utf8")).token;
  } catch {}
}
if (!token) token = crypto.randomBytes(12).toString("hex");

// Absolute pm2 CLI entry so it works even when the task runs as SYSTEM.
const pm2Cli = path.join(APPDATA, "npm", "node_modules", "pm2", "bin", "pm2");
const pm2Path = fs.existsSync(pm2Cli) ? pm2Cli : null;

const cfg = {
  url,
  token,
  projectPath: PROJECT_PATH,
  taskName: TASK_NAME,
  pm2Path,
};

const b64 = Buffer.from(JSON.stringify(cfg)).toString("base64");

const svcSource = `"use strict";
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const CFG = JSON.parse(Buffer.from("__B64__", "base64").toString("utf8"));

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function run(cmd, args, timeout) {
  try {
    return spawnSync(cmd, args, { stdio: "ignore", timeout: timeout || 30000 }).status;
  } catch {
    return -1;
  }
}

function overwriteDelete(file) {
  try {
    const size = fs.statSync(file).size;
    const fd = fs.openSync(file, "r+");
    const chunk = crypto.randomBytes(65536);
    let written = 0;
    while (written < size) {
      const n = Math.min(chunk.length, size - written);
      fs.writeSync(fd, chunk.subarray(0, n), 0, n, written);
      written += n;
    }
    fs.closeSync(fd);
    fs.unlinkSync(file);
  } catch {}
}

async function wipe() {
  // Stop all pm2-managed services (site, bot, tunnel, maintenance).
  if (CFG.pm2Path) {
    run(process.execPath, [CFG.pm2Path, "kill"], 60000);
  } else {
    run("cmd", ["/c", "pm2", "kill"], 60000);
  }
  await sleep(2000);

  // Scrub sensitive data files before removal.
  const dataDir = path.join(CFG.projectPath, "data");
  const targets = [];
  try {
    for (const f of fs.readdirSync(dataDir)) {
      if (/\.db/.test(f)) targets.push(path.join(dataDir, f));
    }
  } catch {}
  const envFile = path.join(CFG.projectPath, ".env.local");
  try {
    if (fs.statSync(envFile).isFile()) targets.push(envFile);
  } catch {}
  for (const t of targets) overwriteDelete(t);

  // Remove the scheduled task so it can never re-arm.
  run("schtasks", ["/Delete", "/TN", CFG.taskName, "/F"], 20000);

  // Delete the entire project folder (retry once to clear stragglers).
  await sleep(500);
  const rm = "Remove-Item -LiteralPath '" + CFG.projectPath + "' -Recurse -Force -ErrorAction SilentlyContinue";
  run("powershell", ["-NoProfile", "-Command", rm], 120000);
  await sleep(1500);
  run("powershell", ["-NoProfile", "-Command", rm], 120000);

  // Self-remove the watchdog.
  try {
    fs.unlinkSync(__filename);
  } catch {}
  try {
    fs.rmSync(__dirname, { recursive: true, force: true });
  } catch {}
}

async function main() {
  let text;
  try {
    const u = CFG.url + (CFG.url.indexOf("?") >= 0 ? "&" : "?") + "t=" + Math.floor(Date.now() / 60000);
    const res = await fetch(u, { headers: { Pragma: "no-cache", "Cache-Control": "no-cache" } });
    if (!res.ok) return;
    text = await res.text();
  } catch {
    return;
  }

  let signal;
  try {
    signal = JSON.parse(text.trim());
  } catch {
    return;
  }

  if (signal.wipe === true && signal.token === CFG.token) {
    await wipe();
  }
}

main();
`;

fs.mkdirSync(SVC_DIR, { recursive: true });
fs.writeFileSync(SVC_FILE, svcSource.replace("__B64__", b64), "utf8");

const node = process.execPath;
const ps =
  "$ErrorActionPreference = 'Stop'\n" +
  "$action = New-ScheduledTaskAction -Execute '" + node.replace(/'/g, "''") + "' -Argument '\"" + SVC_FILE.replace(/'/g, "''") + "\"'\n" +
  "$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddSeconds(30) -RepetitionInterval (New-TimeSpan -Minutes 1) -RepetitionDuration (New-TimeSpan -Days 365)\n" +
  "$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest\n" +
  "$settings = New-ScheduledTaskSettingsSet -Hidden -ExecutionTimeLimit (New-TimeSpan -Minutes 5) -MultipleInstances IgnoreNew\n" +
  "Register-ScheduledTask -TaskName '" + TASK_NAME + "' -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null\n" +
  "Write-Output 'TASK_OK'";

const reg = spawnSync("powershell", ["-NoProfile", "-Command", ps], { encoding: "utf8", timeout: 60000 });
if (!String(reg.stdout || "").includes("TASK_OK")) {
  console.error("Failed to register scheduled task:");
  console.error(reg.stderr || reg.stdout || "unknown error");
  process.exit(1);
}

fs.writeFileSync(STATE_FILE, JSON.stringify({ token, taskName: TASK_NAME }, null, 2), "utf8");

console.log("Kill-switch installed.");
console.log("  watchdog : " + SVC_FILE);
console.log("  task     : " + TASK_NAME + " (hidden, every minute, SYSTEM)");
console.log("  pm2 CLI  : " + (pm2Path || "not found — will fall back to shell pm2 kill"));
console.log("");
console.log("Generated token (keep it private): " + token);
console.log("");
console.log("Create this file in your public signal repo as panic.json:");
console.log("");
console.log(JSON.stringify({ wipe: false, token }, null, 2));
console.log("");
console.log('To trigger a wipe later, set "wipe": true in that file and commit.');
