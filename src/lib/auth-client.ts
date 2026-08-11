export function getDiscordLoginUrl(): string {
  const redirectUri =
    process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI ||
    "https://phoenixrp.online/api/auth/callback";

  const clientId =
    process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || process.env.DISCORD_CLIENT_ID!;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify guilds.members.read",
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}
