import type { Metadata } from "next";
import Storyline from "@/components/Storyline";
import { getSiteBranding } from "@/lib/site-branding";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getSiteBranding();
  return {
    title: `Storyline — ${siteName}`,
    description: `The lore of ${siteName} — from the fall of Los Santos to the false paradise of Roxwood.`,
  };
}

export default function StorylinePage() {
  return (
    <main className="pt-16 lg:pt-[64px]">
      <Storyline />
    </main>
  );
}
