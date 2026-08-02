import { NextResponse } from "next/server";
import { getSession, createSession, setSessionCookie } from "@/lib/auth";
import { ROLES, getUserRoles } from "@/lib/discord";

export type UserState =
  | { state: "logged_out" }
  | { state: "not_in_server"; user: { id: string; username: string; avatar: string }; isStaff: boolean }
  | { state: "whitelisted"; user: { id: string; username: string; avatar: string }; isStaff: boolean }
  | { state: "needs_apply"; user: { id: string; username: string; avatar: string }; isStaff: boolean }
  | { state: "needs_checkin"; user: { id: string; username: string; avatar: string }; isStaff: boolean }
  | { state: "banned"; user: { id: string; username: string; avatar: string }; isStaff: boolean }
  | { state: "blacklisted"; user: { id: string; username: string; avatar: string }; isStaff: boolean };

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ state: "logged_out" } satisfies UserState);
  }

  const user = {
    id: session.userId,
    username: session.username,
    avatar: session.avatar,
  };

  // If roles are already cached in session, use them
  console.log("[status] Session roles:", session.roles, "isStaff:", session.isStaff);
  if (session.roles && session.roles.length > 0) {
    const roles = session.roles;
    const isStaff = session.isStaff;

    if (roles.includes(ROLES.BLACKLISTED)) {
      return NextResponse.json({ state: "blacklisted", user, isStaff } satisfies UserState);
    }
    if (roles.includes(ROLES.BANNED)) {
      return NextResponse.json({ state: "banned", user, isStaff } satisfies UserState);
    }
    if (roles.includes(ROLES.WHITELISTED)) {
      return NextResponse.json({ state: "whitelisted", user, isStaff } satisfies UserState);
    }
    if (roles.includes(ROLES.CHECKIN)) {
      return NextResponse.json({ state: "needs_checkin", user, isStaff } satisfies UserState);
    }
    return NextResponse.json({ state: "needs_apply", user, isStaff } satisfies UserState);
  }

  // First login — fetch roles from Discord and cache in session
  console.log("[status] No cached roles — fetching from Discord for", session.userId);
  try {
    const roles = await getUserRoles(session.userId);
    const isStaff = roles.includes(ROLES.STAFF);
    console.log("[status] Fetched roles:", roles, "isStaff:", isStaff);

    // Update session with cached roles
    const updatedToken = await createSession({
      ...session,
      roles,
      isStaff,
    });
    await setSessionCookie(updatedToken);

    if (roles.includes(ROLES.BLACKLISTED)) {
      return NextResponse.json({ state: "blacklisted", user, isStaff } satisfies UserState);
    }
    if (roles.includes(ROLES.BANNED)) {
      return NextResponse.json({ state: "banned", user, isStaff } satisfies UserState);
    }
    if (roles.includes(ROLES.WHITELISTED)) {
      return NextResponse.json({ state: "whitelisted", user, isStaff } satisfies UserState);
    }
    if (roles.includes(ROLES.CHECKIN)) {
      return NextResponse.json({ state: "needs_checkin", user, isStaff } satisfies UserState);
    }
    return NextResponse.json({ state: "needs_apply", user, isStaff } satisfies UserState);
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json({ state: "not_in_server", user, isStaff: false } satisfies UserState);
  }
}
