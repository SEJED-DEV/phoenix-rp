import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import ConfigHub from "@/components/ConfigHub";
import { isHighRank, canEditQuestions } from "@/lib/application-questions";
import { getUserRolesFromHeaders } from "@/lib/permissions";
import { ON_SITE_APPLICATIONS } from "@/lib/apply.config";

export const metadata: Metadata = {
  title: "Config — Staff Panel",
  description: "Manage application question editors, reviewers and approvers, plus site-wide shop and FAQ content.",
};

export default async function ConfigPageRoute() {
  const h = await headers();
  const level = h.get("x-role-level") || "";
  const userId = h.get("x-user-id") || "";
  const roles = getUserRolesFromHeaders(h);

  const canAccess =
    isHighRank(level) ||
    ON_SITE_APPLICATIONS.some((slug) => canEditQuestions(userId, roles, slug));

  if (!canAccess) {
    return (
      <main className="pt-16 lg:pt-[64px] min-h-screen bg-bg">
        <div className="text-center py-40">
          <h1 className="font-display text-2xl tracking-wider text-white mb-3">Access Denied</h1>
          <p className="text-text-muted text-sm mb-6">
            Only Management &amp; Owner, or users granted editor access to a department, can access the configuration page.
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
      <ConfigHub />
    </main>
  );
}
