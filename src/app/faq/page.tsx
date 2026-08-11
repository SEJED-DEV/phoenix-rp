import type { Metadata } from "next";
import FAQ from "@/components/FAQ";
import { getSiteBranding } from "@/lib/site-branding";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getSiteBranding();
  return {
    title: `FAQ — ${siteName}`,
    description: `Frequently asked questions about ${siteName}.`,
  };
}

export default function FAQPage() {
  return (
    <main className="pt-16 lg:pt-[64px]">
      <FAQ />
    </main>
  );
}
