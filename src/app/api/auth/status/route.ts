import { NextResponse } from "next/server";
import { getFreshSession } from "@/lib/auth";
import { ROLES } from "@/lib/discord";

export type UserState =
  | { state: "logged_out" }
  | { state: "not_in_server"; user: { id: string; username: string; avatar: string }; isStaff: boolean }
  | { state: "whitelisted"; user: { id: string; username: string; avatar: string }; isStaff: boolean }
  | { state: "needs_apply"; user: { id: string; username: string; avatar: string }; isStaff: boolean }
  | { state: "needs_checkin"; user: { id: string; username: string; avatar: string }; isStaff: boolean }
  | { state: "banned"; user: { id: string; username: string; avatar: string }; isStaff: boolean }
  | { state: "blacklisted"; user: { id: string; username: string; avatar: string }; isStaff: boolean };

export async function GET() {
  const session = await getFreshSession();
  if (!session) {
    return NextResponse.json({ state: "logged_out" } satisfies UserState);
  }

  const user = {
    id: session.userId,
    username: session.username,
    avatar: session.avatar,
  };

  const roles = session.roles || [];
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
