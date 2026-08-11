import type { Metadata } from "next";
import Staff from "@/components/Staff";
import { getSiteBranding } from "@/lib/site-branding";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getSiteBranding();
  return {
    title: `Staff — ${siteName}`,
    description: `Meet the team running ${siteName}.`,
  };
}

export default function StaffPage() {
  return (
    <main className="pt-16 lg:pt-[64px]">
      <Staff />
    </main>
  );
}
