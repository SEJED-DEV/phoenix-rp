import { NextRequest, NextResponse } from "next/server";
import { createSession, setSessionCookie } from "@/lib/auth";
import { getUserRoles, ROLES } from "@/lib/discord";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", SITE_URL));
  }

  try {
    const redirectUri =
      process.env.DISCORD_REDIRECT_URI || "https://phoenixrp.online/api/auth/callback";

    // Exchange code for access token
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL("/?error=token_exchange_failed", SITE_URL));
    }

    const { access_token } = await tokenRes.json();

    // Fetch user info
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(new URL("/?error=user_fetch_failed", SITE_URL));
    }

    const user = await userRes.json();

    // Fetch the user's current guild roles so the session is correct from the start
    let roles: string[] = [];
    let isStaff = false;
    try {
      roles = await getUserRoles(user.id);
      isStaff = roles.includes(ROLES.STAFF);
    } catch (error) {
      console.error("Failed to fetch roles at login:", error);
    }

    // Create session
    const token = await createSession({
      userId: user.id,
      username: user.username,
      discriminator: user.discriminator || "0",
      avatar: user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator || "0") % 5}.png`,
      accessToken: access_token,
      roles,
      isStaff,
    });

    await setSessionCookie(token);

    return NextResponse.redirect(new URL("/", SITE_URL));
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(new URL("/?error=internal", SITE_URL));
  }
}
