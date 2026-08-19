import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import GalleryEditor from "@/components/GalleryEditor";
import { getUserRolesFromHeaders } from "@/lib/permissions";
import { canEditSiteConfigScope } from "@/lib/site-config-access";

export const metadata: Metadata = {
  title: "Gallery Config — Staff Panel",
  description: "Manage gallery images, descriptions and ordering.",
};

export const dynamic = "force-dynamic";

export default async function GalleryConfigPage() {
  const h = await headers();
  const userId = h.get("x-user-id") || "";
  const userRoles = getUserRolesFromHeaders(h);
  const allowed = await canEditSiteConfigScope(userId, userRoles, "gallery");

  if (!allowed) {
    return (
      <main className="pt-16 lg:pt-[64px] min-h-screen bg-bg">
        <div className="text-center py-40">
          <h1 className="font-display text-2xl tracking-wider text-white mb-3">Access Denied</h1>
          <p className="text-text-muted text-sm mb-6">
            Only the site owner or granted gallery editors can access this page.
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
      <GalleryEditor />
    </main>
  );
}
