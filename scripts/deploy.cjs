"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const http = require("http");

const ROOT = path.join(__dirname, "..");
const FLAG = path.join(ROOT, "maintenance.flag");

function setFlag() {
  fs.writeFileSync(FLAG, "1");
  console.log("[deploy] Maintenance mode ON — visitors see the branded page.");
}

function clearFlag() {
  fs.rmSync(FLAG, { force: true });
  console.log("[deploy] Maintenance mode OFF — site is live.");
}

function waitForSite(timeoutMs) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      if (Date.now() - start > timeoutMs) {
        return reject(new Error("Timed out waiting for the site to come back on :3000"));
      }
      const req = http.get({ host: "127.0.0.1", port: 3000, path: "/", timeout: 3000 }, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) resolve();
        else setTimeout(check, 2000);
      });
      req.on("error", () => setTimeout(check, 2000));
      req.on("timeout", () => {
        req.destroy();
        setTimeout(check, 2000);
      });
    };
    check();
  });
}

(async () => {
  setFlag();
  try {
    console.log("[deploy] Building...");
    execSync("npm run build", { stdio: "inherit", cwd: ROOT });

    console.log("[deploy] Restarting site process...");
    execSync("npx pm2 restart site --update-env", { stdio: "inherit", cwd: ROOT });

    await waitForSite(90000);
    clearFlag();
    console.log("[deploy] Done — deployment complete.");
  } catch (e) {
    console.error("[deploy] FAILED — maintenance mode left ON so visitors see the branded page instead of errors.");
    console.error(e.message);
    console.error("Fix the issue and re-run: npm run deploy");
    console.error("Or force back online: npm run maintain:off");
    process.exitCode = 1;
  }
})();
