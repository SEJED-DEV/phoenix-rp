import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import { getSiteUrl } from "@/lib/site-url";

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET || "fallback-secret");
const COOKIE_NAME = "phoenix_session";
const EXPIRY = 7 * 24 * 60 * 60;

const STAFF_ROLE = "1504840075945443513";

const MANAGEMENT_ROLES = [
  "985444871722631199", // Creator
  "1471841519970287789", // Founder
  "1504840040424018123", // Owner
  "1504840052654735390", // Server Supervisor
  "1504840056333144246", // Server Manager
  "1504840058174443582", // Discord Manager
  "1504850103154901014", // Admin Supervisor
];

const OWNER_ROLES = [
  "985444871722631199", // Creator
  "1471841519970287789", // Founder
  "1504840040424018123", // Owner
];

async function fetchLiveRoles(userId: string): Promise<string[] | null> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!token || !guildId) return null;
  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}`, {
      headers: { Authorization: `Bot ${token}` },
    });
    if (!res.ok) return null;
    const member = await res.json();
    return member.roles || [];
  } catch {
    return null;
  }
}

export const config = {
  matcher: ["/staff-panel/:path*", "/api/:path*"],
};

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Public API routes: keep them working, but never let search engines index
  // them — URLs like /api/auth/callback?code=... trip Google's phishing
  // heuristics and flag the whole domain.
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/staff")) {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      res.headers.set("X-Robots-Tag", "noindex, nofollow");
      return res;
    }
    return NextResponse.redirect(new URL("/", getSiteUrl()));
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const userId = String(payload.userId || "");
    const username = String(payload.username || "");

    let roles = await fetchLiveRoles(userId);
    if (roles === null) {
      roles = Array.isArray(payload.roles) ? (payload.roles as string[]) : [];
    }

    const isStaff = roles.includes(STAFF_ROLE);
    if (!isStaff) {
      if (pathname.startsWith("/api/")) {
        const res = NextResponse.json({ error: "Forbidden" }, { status: 403 });
        res.headers.set("X-Robots-Tag", "noindex, nofollow");
        return res;
      }
      return NextResponse.redirect(new URL("/", getSiteUrl()));
    }

    const isManagement = roles.some((r) => MANAGEMENT_ROLES.includes(r));
    const isOwner = roles.some((r) => OWNER_ROLES.includes(r));

    const roleLevel = isOwner ? "owner" : isManagement ? "management" : "staff";

    const headers = new Headers(req.headers);
    headers.set("x-user-id", userId);
    headers.set("x-user-name", username);
    headers.set("x-role-level", roleLevel);

    const response = NextResponse.next({ request: { headers } });
    response.headers.set("X-Robots-Tag", "noindex, nofollow");

    const { iat: _iat, exp: _exp, ...sessionData } = payload;
    const updatedToken = await new SignJWT({ ...sessionData, roles, isStaff })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${EXPIRY}s`)
      .sign(SECRET);

    response.cookies.set(COOKIE_NAME, updatedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: EXPIRY,
      path: "/",
    });

    return response;
  } catch {
    if (pathname.startsWith("/api/")) {
      const res = NextResponse.json({ error: "Invalid session" }, { status: 401 });
      res.headers.set("X-Robots-Tag", "noindex, nofollow");
      return res;
    }
    return NextResponse.redirect(new URL("/", getSiteUrl()));
  }
}
