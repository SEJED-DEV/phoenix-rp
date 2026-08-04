"use strict";

const fs = require("fs");
const path = require("path");

const flag = path.join(__dirname, "..", "maintenance.flag");
const mode = process.argv[2];

if (mode === "on") {
  fs.writeFileSync(flag, "1");
  console.log("Maintenance mode ON — visitors will see the maintenance page.");
} else if (mode === "off") {
  fs.rmSync(flag, { force: true });
  console.log("Maintenance mode OFF — site serving normally.");
} else {
  console.log("Usage: node scripts/maintain.cjs <on|off>");
  process.exitCode = 1;
}
