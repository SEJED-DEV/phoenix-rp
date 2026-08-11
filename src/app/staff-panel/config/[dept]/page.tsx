import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import DeptConfig from "@/components/DeptConfig";
import { isHighRank, canEditQuestions } from "@/lib/application-questions";
import { getUserRolesFromHeaders } from "@/lib/permissions";
import { isOnSiteSlug, getApplyConfig } from "@/lib/apply.config";

export async function generateMetadata({ params }: { params: Promise<{ dept: string }> }): Promise<Metadata> {
  const { dept } = await params;
  const name = getApplyConfig(dept)?.label ?? dept.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${name} Config — Staff Panel`,
    description: `Manage question editors, reviewers and approvers for the ${name} application.`,
  };
}

export default async function DeptConfigPage({ params }: { params: Promise<{ dept: string }> }) {
  const { dept } = await params;
  if (!isOnSiteSlug(dept)) notFound();

  const h = await headers();
  const level = h.get("x-role-level") || "";
  const userId = h.get("x-user-id") || "";
  const roles = getUserRolesFromHeaders(h);

  const canAccess = isHighRank(level) || canEditQuestions(userId, roles, dept);
  const name = getApplyConfig(dept)?.label ?? dept;

  if (!canAccess) {
    return (
      <main className="pt-16 lg:pt-[64px] min-h-screen bg-bg">
        <div className="text-center py-40">
          <h1 className="font-display text-2xl tracking-wider text-white mb-3">Access Denied</h1>
          <p className="text-text-muted text-sm mb-6">
            Only Management &amp; Owner, or users granted editor access, can manage this department.
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
      <DeptConfig slug={dept} label={name} />
    </main>
  );
}
