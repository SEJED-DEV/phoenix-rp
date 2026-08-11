import { NextResponse } from "next/server";
import { getShopItems, getShopSettings } from "@/lib/shop.config";

export async function GET() {
  const settings = getShopSettings();
  const items = getShopItems(true);

  return NextResponse.json({
    settings: {
      currency: settings.currency,
      notice: settings.notice,
      noticeEnabled: settings.noticeEnabled,
      globalPrices: settings.globalPrices,
    },
    items: items.map((it) => ({
      id: it.id,
      name: it.name,
      description: it.description,
      prices: it.prices,
      image: it.image,
      forumUrl: it.forumUrl,
    })),
  });
}
