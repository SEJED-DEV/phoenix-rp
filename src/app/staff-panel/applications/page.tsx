import type { Metadata } from "next";
import ApplicationsPanel from "@/components/ApplicationsPanel";

export const metadata: Metadata = {
  title: "Applications — Staff Panel",
  description: "Review and manage player applications.",
};

export default function ApplicationsPage() {
  return (
    <main className="pt-16 lg:pt-[64px] min-h-screen bg-bg">
      <ApplicationsPanel />
    </main>
  );
}
