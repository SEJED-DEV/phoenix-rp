import { getDb } from "./db";
import { getForumPosts } from "./discord";
import { saveRemoteShopImage } from "./shop-uploads";

export interface ShopSettings {
  forumChannel: string;
  currency: string;
  notice: string;
  noticeEnabled: boolean;
  globalPrices: PriceOption[];
}

export interface PriceOption {
  name: string;
  value: string;
}

export interface ShopItem {
  id: number;
  name: string;
  description: string;
  prices: PriceOption[];
  image: string;
  source: string;
  forumThreadId: string | null;
  forumUrl: string | null;
  active: boolean;
  position: number;
}

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  forumChannel: "",
  currency: "Credits",
  notice: "",
  noticeEnabled: false,
  globalPrices: [],
};

const SETTING_KEYS = {
  forumChannel: "shop_forum_channel",
  currency: "shop_currency",
  notice: "shop_notice",
  noticeEnabled: "shop_notice_enabled",
  globalPrices: "shop_global_prices",
} as const;

export function getShopSettings(): ShopSettings {
  const db = getDb();
  const rows = db
    .prepare("SELECT key, value FROM server_config WHERE key LIKE 'shop_%'")
    .all() as { key: string; value: string }[];
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;

  return {
    forumChannel: map[SETTING_KEYS.forumChannel] ?? DEFAULT_SHOP_SETTINGS.forumChannel,
    currency: map[SETTING_KEYS.currency] || DEFAULT_SHOP_SETTINGS.currency,
    notice: map[SETTING_KEYS.notice] ?? DEFAULT_SHOP_SETTINGS.notice,
    noticeEnabled: map[SETTING_KEYS.noticeEnabled] === "true",
    globalPrices: parsePrices(map[SETTING_KEYS.globalPrices] ?? ""),
  };
}

export function updateShopSettings(settings: ShopSettings): void {
  const db = getDb();
  const upsert = db.prepare(`
    INSERT INTO server_config (key, value, updatedAt) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = datetime('now')
  `);
  const tx = db.transaction(() => {
    upsert.run(SETTING_KEYS.forumChannel, settings.forumChannel);
    upsert.run(SETTING_KEYS.currency, settings.currency);
    upsert.run(SETTING_KEYS.notice, settings.notice);
    upsert.run(SETTING_KEYS.noticeEnabled, settings.noticeEnabled ? "true" : "false");
    upsert.run(
      SETTING_KEYS.globalPrices,
      JSON.stringify(
        settings.globalPrices
          .map((p) => ({ name: p.name.trim(), value: p.value.trim() }))
          .filter((p) => p.value !== "")
      )
    );
  });
  tx();
}

interface ShopRow {
  id: number;
  name: string;
  description: string;
  price: string;
  prices: string;
  image: string;
  source: string;
  forumThreadId: string | null;
  forumUrl: string | null;
  active: number;
  position: number;
}

function parsePrices(raw: string): PriceOption[] {
  try {
    const arr = JSON.parse(raw || "[]");
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((p) => p && typeof p === "object")
      .map((p) => ({
        name: String(p.name ?? "").trim(),
        value: String(p.value ?? "").trim(),
      }))
      .filter((p) => p.value !== "");
  } catch {
    return [];
  }
}

export function getShopItems(activeOnly = false): ShopItem[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM shop_items ${activeOnly ? "WHERE active = 1" : ""} ORDER BY position ASC, id ASC`
    )
    .all() as ShopRow[];
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    prices: parsePrices(r.prices),
    image: r.image,
    source: r.source,
    forumThreadId: r.forumThreadId,
    forumUrl: r.forumUrl,
    active: r.active === 1,
    position: r.position,
  }));
}

export function getShopItemCount(): number {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as c FROM shop_items").get() as { c: number };
  return row.c;
}

export function updateShopItems(items: ShopItem[], updatedBy: string): void {
  const db = getDb();
  const del = db.prepare("DELETE FROM shop_items");
  const insert = db.prepare(`
    INSERT INTO shop_items (name, description, price, prices, image, source, forumThreadId, forumUrl, active, position, updatedBy, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  const tx = db.transaction(() => {
    del.run();
    items.forEach((it, i) => {
      const prices = it.prices
        .map((p) => ({ name: p.name.trim(), value: p.value.trim() }))
        .filter((p) => p.value !== "");
      insert.run(
        it.name,
        it.description || "",
        prices.map((p) => p.value).join(" / ") || "",
        JSON.stringify(prices),
        it.image || "",
        it.source || "manual",
        it.forumThreadId ?? null,
        it.forumUrl ?? null,
        it.active ? 1 : 0,
        i,
        updatedBy
      );
    });
  });
  tx();
}

export interface ImportResult {
  imported: number;
  items: ShopItem[];
  errors: string[];
}

export async function importForumItems(forumChannel: string): Promise<ImportResult> {
  const db = getDb();
  const existing = new Set(
    (
      db
        .prepare("SELECT forumThreadId FROM shop_items WHERE forumThreadId IS NOT NULL")
        .all() as { forumThreadId: string }[]
    ).map((r) => r.forumThreadId)
  );

  const posts = await getForumPosts(forumChannel);
  const errors: string[] = [];
  let imported = 0;
  let position = getShopItemCount();

  const insert = db.prepare(`
    INSERT INTO shop_items (name, description, price, prices, image, source, forumThreadId, forumUrl, active, position, updatedAt)
    VALUES (?, '', '', '[]', ?, 'forum', ?, ?, 1, ?, datetime('now'))
  `);

  for (const p of posts) {
    if (existing.has(p.threadId)) continue;

    let image = "";
    if (p.imageUrl) {
      const saved = await saveRemoteShopImage(p.imageUrl);
      if (saved.storedName) {
        image = saved.storedName;
      } else {
        errors.push(`${p.name}: ${saved.error}`);
      }
    } else {
      errors.push(`${p.name}: no image found in the forum post.`);
    }

    insert.run(p.name, image, p.threadId, p.forumUrl, position++);
    imported++;
  }

  return { imported, items: getShopItems(), errors };
}
