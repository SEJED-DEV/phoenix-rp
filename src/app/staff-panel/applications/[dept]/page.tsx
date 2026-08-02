import type { Metadata } from "next";
import ApplicationReview from "@/components/ApplicationReview";

export async function generateMetadata({ params }: { params: Promise<{ dept: string }> }): Promise<Metadata> {
  const { dept } = await params;
  const name = dept.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${name} Applications — Staff Panel`,
    description: `Review ${name} applications.`,
  };
}

export default async function ApplicationReviewPage() {
  return (
    <main className="pt-16 lg:pt-[64px] min-h-screen bg-bg">
      <ApplicationReview />
    </main>
  );
}
