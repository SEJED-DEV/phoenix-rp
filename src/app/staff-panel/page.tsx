import type { Metadata } from "next";
import StaffPanel from "@/components/StaffPanel";

export const metadata: Metadata = {
  title: "Staff Panel — Tunisian Phoenix RP",
  description: "Staff management dashboard.",
};

export default function StaffPanelPage() {
  return (
    <main className="pt-16 lg:pt-[64px] min-h-screen bg-bg">
      <StaffPanel />
    </main>
  );
}
