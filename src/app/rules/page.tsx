import type { Metadata } from "next";
import Rules from "@/components/Rules";

export const metadata: Metadata = {
  title: "Rules — Tunisian Phoenix RP",
  description: "Server rules and community guidelines for Tunisian Phoenix RP.",
};

export default function RulesPage() {
  return (
    <main className="pt-16 lg:pt-[64px]">
      <Rules />
    </main>
  );
}
