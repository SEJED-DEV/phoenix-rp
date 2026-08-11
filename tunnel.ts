import { spawn, execSync } from "child_process";
import { initConsoleRelay, enqueueConsoleEntries } from "@/lib/console-relay";

// Runs the Cloudflare tunnel as a child process and forwards every line of its
// stdout/stderr into the console relay queue (and to this process's own stdout
// so `pm2 logs tunnel` still shows the tunnel exactly as before).
//
// On exit the wrapper exits non-zero so PM2 restarts it — the same behaviour
// as running `cloudflared tunnel run phoenix-site` directly.

initConsoleRelay("tunnel");

const cloudflaredPath = (() => {
  try {
    const out = execSync("where cloudflared", { shell: "cmd.exe" })
      .toString()
      .trim()
      .split(/\r?\n/)[0];
    if (out) return out;
  } catch {}
  return "cloudflared";
})();

const ARGS = process.argv.slice(2).length > 0 ? process.argv.slice(2) : ["tunnel", "run", "phoenix-site"];

// cloudflared writes every level to stderr, tagged as `INF`/`WRN`/`ERR`/`FATAL`.
// Map those tags onto relay levels so the Discord colors are meaningful.
function classify(line: string): "log" | "info" | "warn" | "error" {
  if (/\b(ERR|FATAL|PANIC)\b/.test(line)) return "error";
  if (/\b(WRN|WARN)\b/.test(line)) return "warn";
  return "log";
}

console.log(`[tunnel] starting ${cloudflaredPath} ${ARGS.join(" ")}`);

const child = spawn(cloudflaredPath, ARGS, {
  cwd: process.cwd(),
  shell: false,
  stdio: ["ignore", "pipe", "pipe"],
});

child.stdout.setEncoding("utf8");
child.stderr.setEncoding("utf8");

let stdoutBuf = "";
child.stdout.on("data", (chunk: string) => {
  stdoutBuf += chunk;
  const lines = stdoutBuf.split(/\r?\n/);
  stdoutBuf = lines.pop() ?? "";
  enqueueConsoleEntries(
    "tunnel",
    lines.map((line) => ({ level: "log" as const, content: line }))
  );
  for (const line of lines) process.stdout.write(line + "\n");
});

let stderrBuf = "";
child.stderr.on("data", (chunk: string) => {
  stderrBuf += chunk;
  const lines = stderrBuf.split(/\r?\n/);
  stderrBuf = lines.pop() ?? "";
  enqueueConsoleEntries(
    "tunnel",
    lines.map((line) => ({ level: classify(line), content: line }))
  );
  for (const line of lines) process.stderr.write(line + "\n");
});

child.on("error", (err) => {
  console.error(`[tunnel] failed to start: ${err.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (stdoutBuf) {
    enqueueConsoleEntries("tunnel", [{ level: "log", content: stdoutBuf }]);
  }
  if (stderrBuf) {
    enqueueConsoleEntries("tunnel", [{ level: "error", content: stderrBuf }]);
  }
  console.error(
    `[tunnel] cloudflared exited (code=${code ?? "null"} signal=${signal ?? "null"}); restarting`
  );
  process.exit(code && code !== 0 ? code : 1);
});
