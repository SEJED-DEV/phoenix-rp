"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";

interface PriceOption {
  name: string;
  value: string;
}

interface ShopItem {
  id: number;
  name: string;
  description: string;
  prices: PriceOption[];
  image: string;
  forumUrl: string | null;
}

interface ShopData {
  settings: {
    currency: string;
    notice: string;
    noticeEnabled: boolean;
    globalPrices: PriceOption[];
  };
  items: ShopItem[];
}

type SortMode = "featured" | "name" | "price-asc" | "price-desc";

function renderNotice(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|(https?:\/\/[^\s<>"')\]]+)/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const label = m[1];
    const href = m[2] || m[3];
    if (href) {
      nodes.push(
        <a
          key={key++}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold underline underline-offset-2 break-all hover:text-gold-bright transition-colors"
        >
          {label || href}
        </a>
      );
    }
    last = regex.lastIndex;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function priceValue(p: PriceOption): number {
  const raw = p.value.replace(/[^0-9.,]/g, "").replace(/,/g, "");
  const n = parseFloat(raw);
  return isNaN(n) ? Number.MAX_SAFE_INTEGER : n;
}

function DiscordIcon() {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export default function ShopPage() {
  const [data, setData] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("featured");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/shop")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ShopData | null) => {
        if (!cancelled && d) setData(d);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!data) return [];
    const list = data.items.filter(
      (it) =>
        !q ||
        it.name.toLowerCase().includes(q) ||
        (it.description || "").toLowerCase().includes(q)
    );
    const arr = [...list];
    switch (sort) {
      case "name":
        arr.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "price-asc":
        arr.sort((a, b) => priceValue(a.prices[0] || { value: "" }) - priceValue(b.prices[0] || { value: "" }));
        break;
      case "price-desc":
        arr.sort((a, b) => priceValue(b.prices[0] || { value: "" }) - priceValue(a.prices[0] || { value: "" }));
        break;
      default:
        break;
    }
    return arr;
  }, [data, q, sort]);

  const effectivePrices = (item: ShopItem): PriceOption[] =>
    item.prices.length > 0 ? item.prices : data?.settings.globalPrices ?? [];

  return (
    <section className="relative min-h-screen bg-bg">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-bg" />
        <div className="absolute top-[-25%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full blur-[200px]" style={{ background: "color-mix(in srgb, var(--color-crimson) 4%, transparent)" }} />
      </div>

      <div className="sc-shell">
        {/* Header */}
        <div className="sc-header">
          <div className="sc-eyebrow">Server Shop</div>
          <h1 className="sc-title">Shop</h1>
          <p className="sc-sub">
            Browse the catalog and find what fits your style. Prices are in-game unless marked otherwise.
          </p>
        </div>

        {loading ? (
          <div>
            <div className="sc-toolbar">
              <div className="sc-toolbar-left">
                <Skeleton className="h-[42px] w-full max-w-[340px]" />
                <Skeleton className="h-[42px] w-[150px]" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="sc-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} className="overflow-hidden">
                  <Skeleton className="w-full aspect-[4/3] rounded-none" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                    <div className="flex justify-between pt-1">
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-10 w-full mt-1" />
                  </div>
                </SkeletonCard>
              ))}
            </div>
          </div>
        ) : !data ? (
          <div className="tk-empty">
            <div className="tk-empty-icon">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h3>Couldn&apos;t load the shop</h3>
            <p>Try refreshing the page.</p>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="sc-toolbar">
              <div className="sc-toolbar-left">
                <div className="sc-search">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search items..."
                    aria-label="Search items"
                  />
                </div>
                <select className="sc-sort" value={sort} onChange={(e) => setSort(e.target.value as SortMode)} aria-label="Sort items">
                  <option value="featured">Featured</option>
                  <option value="name">Name A–Z</option>
                  <option value="price-asc">Price · Low → High</option>
                  <option value="price-desc">Price · High → Low</option>
                </select>
              </div>
              <span className="sc-count">
                {filtered.length} {filtered.length === 1 ? "item" : "items"}
              </span>
            </div>

            {/* Notice */}
            {data.settings.noticeEnabled && data.settings.notice.trim() && (
              <div className="sc-notice">
                <p className="text-sm text-text-dim leading-relaxed">{renderNotice(data.settings.notice)}</p>
              </div>
            )}

            {/* Global prices */}
            {data.settings.globalPrices.length > 0 && (
              <div className="sc-global">
                <span className="sc-global-label">Standard prices</span>
                {data.settings.globalPrices.map((p, i) => (
                  <span key={i} className="sc-global-item">
                    {p.name ? `${p.name} · ` : ""}
                    {p.value}
                    {data.settings.currency ? ` ${data.settings.currency}` : ""}
                  </span>
                ))}
              </div>
            )}

            {/* Items */}
            {filtered.length === 0 ? (
              <div className="tk-empty">
                <div className="tk-empty-icon">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                  </svg>
                </div>
                <h3>{data.items.length === 0 ? "The shop is being stocked" : "No matches found"}</h3>
                <p>
                  {data.items.length === 0
                    ? "New items are on the way — check back soon."
                    : `Nothing matches "${query}". Try a different search.`}
                </p>
                {q && (
                  <button className="gal-filter active" style={{ cursor: "pointer", marginTop: 20 }} onClick={() => setQuery("")}>
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="sc-grid">
                {filtered.map((item) => {
                  const prices = effectivePrices(item);
                  return (
                    <article className="sc-card" key={item.id}>
                      <div className="sc-card-img">
                        {item.image ? (
                          <img
                            src={`/api/shop/image/${encodeURIComponent(item.image)}`}
                            alt={item.name}
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a]">
                            <img src="/api/site/logo" alt="" className="w-16 h-16 object-contain opacity-40" />
                          </div>
                        )}
                      </div>
                      <div className="sc-card-body">
                        <h3 className="sc-card-name">{item.name}</h3>
                        {item.description && <p className="sc-card-desc">{item.description}</p>}
                        {prices.length > 0 && (
                          <div className="sc-prices">
                            {prices.map((p, i) => (
                              <div className="sc-price-row" key={i}>
                                <span className="sc-price-label">{p.name || ""}</span>
                                <span className="sc-price-value">
                                  {p.value}
                                  {data.settings.currency && <span className="sc-price-cur">{data.settings.currency}</span>}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="sc-card-foot">
                          {item.forumUrl ? (
                            <a className="sc-card-btn" href={item.forumUrl} target="_blank" rel="noopener noreferrer">
                              <DiscordIcon />
                              View on Discord
                            </a>
                          ) : (
                            <span className="sc-card-btn ghost">
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                              </svg>
                              In-game
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
