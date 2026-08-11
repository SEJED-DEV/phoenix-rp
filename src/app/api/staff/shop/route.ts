import { NextRequest, NextResponse } from "next/server";
import { getUserRolesFromHeaders } from "@/lib/permissions";
import { canEditSiteConfigScope } from "@/lib/site-config-access";
import {
  DEFAULT_SHOP_SETTINGS,
  getShopItems,
  getShopSettings,
  updateShopItems,
  updateShopSettings,
  type ShopItem,
} from "@/lib/shop.config";
import { logStaffAction } from "@/lib/activity-log";

async function isAllowed(req: NextRequest): Promise<boolean> {
  const userId = req.headers.get("x-user-id") || "";
  const roles = getUserRolesFromHeaders(req.headers);
  return canEditSiteConfigScope(userId, roles, "content");
}

export async function GET(req: NextRequest) {
  if (!(await isAllowed(req))) {
    return NextResponse.json({ error: "Only the site owner or granted editors can edit the shop" }, { status: 403 });
  }
  return NextResponse.json({ settings: getShopSettings(), items: getShopItems() });
}

export async function PUT(req: NextRequest) {
  if (!(await isAllowed(req))) {
    return NextResponse.json({ error: "Only the site owner or granted editors can edit the shop" }, { status: 403 });
  }

  const username = req.headers.get("x-user-name") || "";
  const userId = req.headers.get("x-user-id") || "";

  let body: { settings?: unknown; items?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawSettings = body.settings as {
    forumChannel?: unknown;
    currency?: unknown;
    notice?: unknown;
    noticeEnabled?: unknown;
    globalPrices?: unknown;
  } | null;

  const rawGlobalPrices = rawSettings?.globalPrices;
  const globalPrices = Array.isArray(rawGlobalPrices)
    ? rawGlobalPrices
        .map((p) => ({
          name: String((p as { name?: unknown })?.name ?? "").trim(),
          value: String((p as { value?: unknown })?.value ?? "").trim(),
        }))
        .filter((p) => p.value !== "")
        .slice(0, 20)
    : [];

  const settings = {
    forumChannel: String(rawSettings?.forumChannel ?? "").trim(),
    currency: String(rawSettings?.currency ?? "").trim() || DEFAULT_SHOP_SETTINGS.currency,
    notice: String(rawSettings?.notice ?? "").trim(),
    noticeEnabled: rawSettings?.noticeEnabled === true || rawSettings?.noticeEnabled === "true",
    globalPrices,
  };

  const raw = body.items;
  if (!Array.isArray(raw)) {
    return NextResponse.json({ error: "items array is required" }, { status: 400 });
  }
  if (raw.length > 200) {
    return NextResponse.json({ error: "Too many items (max 200)" }, { status: 400 });
  }

  const items: ShopItem[] = raw.map((it, i) => {
    const rawPrices = (it as { prices?: unknown })?.prices;
    const prices = Array.isArray(rawPrices)
      ? rawPrices
          .map((p) => ({
            name: String((p as { name?: unknown })?.name ?? "").trim(),
            value: String((p as { value?: unknown })?.value ?? "").trim(),
          }))
          .filter((p) => p.value !== "")
          .slice(0, 20)
      : [];

    return {
      id: i + 1,
      name: String((it as { name?: unknown })?.name ?? "").trim(),
      description: String((it as { description?: unknown })?.description ?? "").trim(),
      prices,
      image: String((it as { image?: unknown })?.image ?? "").trim(),
      source: String((it as { source?: unknown })?.source ?? "manual").trim() || "manual",
      forumThreadId: (it as { forumThreadId?: unknown })?.forumThreadId
        ? String((it as { forumThreadId?: unknown })!.forumThreadId)
        : null,
      forumUrl: (it as { forumUrl?: unknown })?.forumUrl
        ? String((it as { forumUrl?: unknown })!.forumUrl)
        : null,
      active: (it as { active?: unknown })?.active !== false && (it as { active?: unknown })?.active !== 0,
      position: i,
    };
  });

  for (const it of items) {
    if (!it.name) return NextResponse.json({ error: "Every item needs a name." }, { status: 400 });
  }

  updateShopSettings(settings);
  updateShopItems(items, username);

  logStaffAction({
    actorId: userId,
    actorName: username,
    action: "shop_update",
    reason: "Shop configuration updated",
    metadata: {
      items: items.length,
      noticeEnabled: settings.noticeEnabled,
      currency: settings.currency,
      globalPrices: globalPrices.length,
    },
  });

  return NextResponse.json({ success: true });
}
