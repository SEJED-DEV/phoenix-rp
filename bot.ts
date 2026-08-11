import { Client, GatewayIntentBits } from "discord.js";
import { initConsoleRelay } from "@/lib/console-relay";

initConsoleRelay("bot");

const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
  console.error("Missing DISCORD_BOT_TOKEN in .env.local");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
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

client.login(token);
