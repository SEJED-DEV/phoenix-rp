import type { Metadata } from "next";
import FAQ from "@/components/FAQ";

export const metadata: Metadata = {
  title: "FAQ — Tunisian Phoenix RP",
  description: "Frequently asked questions about Tunisian Phoenix RP.",
};

export default function FAQPage() {
  return (
    <main className="pt-16 lg:pt-[64px]">
      <FAQ />
    </main>
  );
}
