import type { Metadata } from "next";
import ShopPage from "@/components/ShopPage";
import { getSiteBranding } from "@/lib/site-branding";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getSiteBranding();
  return {
    title: `Shop — ${siteName}`,
    description: `Browse the ${siteName} server shop — items, prices and perks.`,
  };
}

export const dynamic = "force-dynamic";

export default function ShopRoute() {
  return <ShopPage />;
}
