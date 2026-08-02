import type { Metadata } from "next";
import MembersPanel from "@/components/MembersPanel";

export const metadata: Metadata = {
  title: "Members — Staff Panel",
  description: "Manage guild members.",
};

export default function MembersPage() {
  return (
    <main className="pt-16 lg:pt-[64px] min-h-screen bg-bg">
      <MembersPanel />
    </main>
  );
}
