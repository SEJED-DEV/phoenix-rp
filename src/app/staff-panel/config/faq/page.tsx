import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import FaqEditor from "@/components/FaqEditor";
import { isHighRank } from "@/lib/application-questions";

export const metadata: Metadata = {
  title: "FAQ Config — Staff Panel",
  description: "Edit the questions shown on the public FAQ page.",
};

export default async function FaqConfigPage() {
  const h = await headers();
  const level = h.get("x-role-level") || "";

  if (!isHighRank(level)) {
    return (
      <main className="pt-16 lg:pt-[64px] min-h-screen bg-bg">
        <div className="text-center py-40">
          <h1 className="font-display text-2xl tracking-wider text-white mb-3">Access Denied</h1>
          <p className="text-text-muted text-sm mb-6">
            Only Management &amp; Owner can access the configuration page.
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
      <FaqEditor />
    </main>
  );
}
