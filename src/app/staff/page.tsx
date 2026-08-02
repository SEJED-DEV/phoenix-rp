import type { Metadata } from "next";
import Staff from "@/components/Staff";

export const metadata: Metadata = {
  title: "Staff — Tunisian Phoenix RP",
  description: "Meet the team running Tunisian Phoenix RP.",
};

export default function StaffPage() {
  return (
    <main className="pt-16 lg:pt-[64px]">
      <Staff />
    </main>
  );
}
