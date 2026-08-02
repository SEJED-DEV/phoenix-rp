import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";

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
  matcher: ["/staff-panel/:path*", "/api/staff/:path+"],
};

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/", req.url));
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
      if (req.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/", req.url));
    }

    const isManagement = roles.some((r) => MANAGEMENT_ROLES.includes(r));
    const isOwner = roles.some((r) => OWNER_ROLES.includes(r));

    const roleLevel = isOwner ? "owner" : isManagement ? "management" : "staff";

    const headers = new Headers(req.headers);
    headers.set("x-user-id", userId);
    headers.set("x-user-name", username);
    headers.set("x-role-level", roleLevel);

    const response = NextResponse.next({ request: { headers } });

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
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/", req.url));
  }
}
