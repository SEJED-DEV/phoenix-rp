import { headers } from "next/headers";
import Link from "next/link";
import SiteBrandingEditor from "@/components/SiteBrandingEditor";
import { getUserRolesFromHeaders } from "@/lib/permissions";
import { canEditSiteScope } from "@/lib/site-config-access";
import { isSiteAppearanceOwner } from "@/lib/site-appearance-access";

export const dynamic = "force-dynamic";

export default async function SiteConfigPage() {
  const h = await headers();
  const userId = h.get("x-user-id") || "";
  const userRoles = getUserRolesFromHeaders(h);
  const isOwner = await isSiteAppearanceOwner(userId);
  const canEdit =
    isOwner ||
    canEditSiteScope(userId, userRoles, "links") ||
    canEditSiteScope(userId, userRoles, "site");

  if (!canEdit) {
    return (
      <main className="pt-16 lg:pt-[64px] min-h-screen bg-bg">
        <div className="text-center py-40">
          <h1 className="font-display text-2xl tracking-wider text-white mb-3">Access Denied</h1>
          <p className="text-text-muted text-sm mb-6">
            Only the site owner or granted editors can change site branding.
          </p>
          <Link href="/staff-panel/config" className="text-crimson text-sm hover:text-crimson/80 transition-colors">
            Back to Config
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-16 lg:pt-[64px] min-h-screen bg-bg">
      <SiteBrandingEditor />
    </main>
  );
}
