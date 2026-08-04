import type { Metadata } from "next";
import Storyline from "@/components/Storyline";

export const metadata: Metadata = {
  title: "Storyline — Tunisian Phoenix RP",
  description: "The lore of Tunisian Phoenix RP — from the fall of Los Santos to the false paradise of Roxwood.",
};

export default function StorylinePage() {
  return (
    <main className="pt-16 lg:pt-[64px]">
      <Storyline />
    </main>
  );
}
