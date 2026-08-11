import type { Metadata } from "next";
import Rules from "@/components/Rules";
import { getSiteBranding } from "@/lib/site-branding";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getSiteBranding();
  return {
    title: `Rules — ${siteName}`,
    description: `Server rules and community guidelines for ${siteName}.`,
  };
}

export default function RulesPage() {
  return (
    <main className="pt-16 lg:pt-[64px]">
      <Rules />
    </main>
  );
}
