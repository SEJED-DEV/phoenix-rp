import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import BroadcastPanel from "@/components/BroadcastPanel";
import { isSiteAppearanceOwner } from "@/lib/site-appearance-access";

export const metadata: Metadata = {
  title: "Mass DM — Staff Panel",
  description: "Send a DM to every member of the Discord server. Owner only.",
};

export const dynamic = "force-dynamic";

export default async function BroadcastPage() {
  const h = await headers();
  const userId = h.get("x-user-id") || "";
  const isOwner = await isSiteAppearanceOwner(userId);

  if (!isOwner) {
    return (
      <main className="pt-16 lg:pt-[64px] min-h-screen bg-bg">
        <div className="text-center py-40">
          <h1 className="font-display text-2xl tracking-wider text-white mb-3">Access Denied</h1>
          <p className="text-text-muted text-sm mb-6">
            Only the site owner can send mass DMs.
          </p>
          <Link href="/staff-panel" className="text-crimson text-sm hover:text-crimson/80 transition-colors">
            Back to Staff Panel
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-16 lg:pt-[64px] min-h-screen bg-bg">
      <BroadcastPanel />
    </main>
  );
}
