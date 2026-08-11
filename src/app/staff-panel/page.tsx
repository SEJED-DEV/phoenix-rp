import type { Metadata } from "next";
import { headers } from "next/headers";
import StaffPanel from "@/components/StaffPanel";
import { getSession } from "@/lib/auth";
import { getSiteBranding } from "@/lib/site-branding";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getSiteBranding();
  return {
    title: `Staff Panel — ${siteName}`,
    description: "Staff management dashboard.",
  };
}

export default async function StaffPanelPage() {
  const h = await headers();
  const roleLevel = h.get("x-role-level") || "staff";
  const session = await getSession();
  const user = session
    ? { id: session.userId, username: session.username, avatar: session.avatar }
    : null;

  return (
    <main className="pt-16 lg:pt-[64px] min-h-screen bg-bg">
      <StaffPanel user={user} roleLevel={roleLevel} />
    </main>
  );
}
