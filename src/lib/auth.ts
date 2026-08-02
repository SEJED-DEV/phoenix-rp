import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET || "fallback-secret");
const COOKIE_NAME = "phoenix_session";
const EXPIRY = 7 * 24 * 60 * 60; // 7 days

export interface SessionData {
  userId: string;
  username: string;
  discriminator: string;
  avatar: string;
  accessToken: string;
  roles: string[];
  isStaff: boolean;
}

export async function createSession(data: SessionData): Promise<string> {
  const token = await new SignJWT(data as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${EXPIRY}s`)
    .sign(SECRET);
  return token;
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionData;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: EXPIRY,
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Returns the session, fetching roles from Discord and re-issuing the
 * cookie if they are missing. Call this from API routes that need to
 * know the user's real roles (tickets, etc.) so we are never blind
 * to a stale/empty session.
 */
export async function ensureSessionRoles(): Promise<SessionData | null> {
  const session = await getSession();
  if (!session) return null;

  if (session.roles && session.roles.length > 0) return session;

  // Roles empty — fetch from Discord and persist
  const { getUserRoles } = await import("./discord");
  const { ROLES } = await import("./discord");
  const roles = await getUserRoles(session.userId);
  const isStaff = roles.includes(ROLES.STAFF);

  const updatedToken = await createSession({ ...session, roles, isStaff });
  await setSessionCookie(updatedToken);

  return { ...session, roles, isStaff };
}
