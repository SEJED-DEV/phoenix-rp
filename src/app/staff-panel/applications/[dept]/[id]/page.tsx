import type { Metadata } from "next";
import ApplicationDetail from "@/components/ApplicationDetail";
import { getApplyConfig } from "@/lib/apply.config";

export async function generateMetadata({ params }: { params: Promise<{ dept: string; id: string }> }): Promise<Metadata> {
  const { dept, id } = await params;
  const name = getApplyConfig(dept)?.label ?? dept.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `Application #${id} — ${name} — Staff Panel`,
    description: `Review ${name} application #${id}.`,
  };
}

export default async function ApplicationDetailPage() {
  return (
    <main className="pt-16 lg:pt-[64px] min-h-screen bg-bg">
      <ApplicationDetail />
    </main>
  );
}
