// pm2 process definitions for phoenix-site.
// Deployed via: npx pm2 delete all && npx pm2 start ecosystem.config.js && npx pm2 save
//
// max_memory_restart recycles any app that balloons (the Aug 2026 outage was
// commit exhaustion on an 8GB box killing the pm2 daemon itself).
// exp_backoff_restart_delay prevents crash-loop spirals from churning the
// daemon (see the 21k-restart EADDRINUSE incident of 2026-08-22).

const TSX_NODE_ARGS = "--env-file=.env.local --import tsx";

module.exports = {
  apps: [
    {
      name: "site",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: __dirname,
      max_memory_restart: "700M",
      exp_backoff_restart_delay: 2000,
    },
    {
      name: "bot",
      script: "bot.ts",
      interpreter: "node",
      node_args: TSX_NODE_ARGS,
      cwd: __dirname,
      max_memory_restart: "600M",
      exp_backoff_restart_delay: 2000,
    },
    {
      name: "broadcast",
      script: "broadcast-worker.ts",
      interpreter: "node",
      node_args: TSX_NODE_ARGS,
      cwd: __dirname,
      max_memory_restart: "600M",
      exp_backoff_restart_delay: 2000,
    },
    {
      name: "relay",
      script: "relay-worker.ts",
      interpreter: "node",
      node_args: TSX_NODE_ARGS,
      cwd: __dirname,
      max_memory_restart: "600M",
      exp_backoff_restart_delay: 2000,
    },
    {
      name: "maintenance",
      script: "maintenance-server.cjs",
      cwd: __dirname,
      max_memory_restart: "300M",
      exp_backoff_restart_delay: 2000,
    },
    {
      name: "tunnel",
      script: "C:\\Program Files (x86)\\cloudflared\\cloudflared.exe",
      args: "tunnel run phoenix-site",
      cwd: __dirname,
      max_memory_restart: "400M",
      exp_backoff_restart_delay: 5000,
    },
  ],
};
