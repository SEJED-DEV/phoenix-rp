import type { Metadata } from "next";
import { getApplyConfig } from "@/lib/apply.config";
import QuestionEditor from "@/components/QuestionEditor";

export async function generateMetadata({ params }: { params: Promise<{ dept: string }> }): Promise<Metadata> {
  const { dept } = await params;
  const name = getApplyConfig(dept)?.label ?? dept.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${name} Questions — Staff Panel`,
    description: `Edit the questions shown on the ${name} application.`,
  };
}

export default async function QuestionEditorPage({ params }: { params: Promise<{ dept: string }> }) {
  const { dept } = await params;
  return (
    <main className="pt-16 lg:pt-[64px] min-h-screen bg-bg">
      <QuestionEditor dept={dept} />
    </main>
  );
}
