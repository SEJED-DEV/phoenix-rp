module.exports = {
  apps: [
    {
      name: "site",
      interpreter: "node",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: __dirname,
      env: { NODE_ENV: "production" },
      restart_delay: 3000,
      max_restarts: 10,
    },
    {
      name: "bot",
      interpreter: "node",
      script: "node_modules/tsx/dist/cli.cjs",
      args: "--env-file=.env.local bot.ts",
      cwd: __dirname,
      env: { NODE_ENV: "production" },
      restart_delay: 3000,
      max_restarts: 10,
    },
    {
      name: "tunnel",
      script: "cloudflared",
      args: "tunnel run phoenix-site",
      cwd: __dirname,
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};
