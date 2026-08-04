import type { Metadata } from "next";
import LogsPanel from "@/components/LogsPanel";

export const metadata: Metadata = {
  title: "Activity Logs — Staff Panel",
  description: "Browse every staff action with full metadata.",
};

export default function LogsPage() {
  return (
    <main className="pt-16 lg:pt-[64px] min-h-screen bg-bg">
      <LogsPanel />
    </main>
  );
}
