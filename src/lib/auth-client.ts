export function getDiscordLoginUrl(): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const redirectUri = origin
    ? `${origin}/api/auth/callback`
    : process.env.DISCORD_REDIRECT_URI || "http://localhost:3000/api/auth/callback";

  const clientId = typeof window !== "undefined"
    ? "1525591574505853069"
    : process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || process.env.DISCORD_CLIENT_ID!;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify guilds.members.read",
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}
