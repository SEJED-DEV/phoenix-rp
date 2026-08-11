"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";
import type { PriceOption, ShopItem, ShopSettings } from "@/lib/shop.config";

interface EditorData {
  settings: ShopSettings;
  items: ShopItem[];
}

interface Toast {
  type: "success" | "error" | "info";
  text: string;
}

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-text-muted/30 text-xs focus:outline-none focus:border-crimson/40 transition-all";
const labelClass = "block text-[10px] text-text-muted uppercase tracking-wider mb-1.5";

export default function ShopEditor() {
  const [data, setData] = useState<EditorData | null>(null);
  const [settings, setSettings] = useState<ShopSettings>({
    forumChannel: "",
    currency: "Credits",
    notice: "",
    noticeEnabled: false,
    globalPrices: [],
  });
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    let cancelled = false;
    fetch("/api/staff/shop")
      .then(async (r) => {
        if (r.status === 403) {
          if (!cancelled) setDenied(true);
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((d: EditorData | null) => {
        if (cancelled || !d) return;
        setData(d);
        setSettings(d.settings);
        setItems(d.items);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const flash = (type: Toast["type"], text: string) => setToast({ type, text });

  const updateItem = (index: number, patch: Partial<ShopItem>) => {
    setItems((list) => list.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const move = (index: number, dir: -1 | 1) => {
    setItems((list) => {
      const next = [...list];
      const target = index + dir;
      if (target < 0 || target >= next.length) return list;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const remove = (index: number) => {
    setItems((list) => list.filter((_, i) => i !== index));
  };

  const add = () => {
    setItems((list) => [
      ...list,
      {
        id: Date.now(),
        name: "New Item",
        description: "",
        prices: [],
        image: "",
        source: "manual",
        forumThreadId: null,
        forumUrl: null,
        active: true,
        position: list.length,
      },
    ]);
  };

  const updatePrice = (itemIndex: number, priceIndex: number, patch: Partial<PriceOption>) => {
    setItems((list) =>
      list.map((it, i) =>
        i === itemIndex
          ? { ...it, prices: it.prices.map((p, pi) => (pi === priceIndex ? { ...p, ...patch } : p)) }
          : it
      )
    );
  };

  const removePrice = (itemIndex: number, priceIndex: number) => {
    setItems((list) =>
      list.map((it, i) =>
        i === itemIndex ? { ...it, prices: it.prices.filter((_, pi) => pi !== priceIndex) } : it
      )
    );
  };

  const addPrice = (itemIndex: number) => {
    setItems((list) =>
      list.map((it, i) =>
        i === itemIndex ? { ...it, prices: [...it.prices, { name: "", value: "" }] } : it
      )
    );
  };

  const updateGlobalPrice = (index: number, patch: Partial<PriceOption>) => {
    setSettings((s) => ({
      ...s,
      globalPrices: s.globalPrices.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }));
  };

  const removeGlobalPrice = (index: number) => {
    setSettings((s) => ({ ...s, globalPrices: s.globalPrices.filter((_, i) => i !== index) }));
  };

  const addGlobalPrice = () => {
    setSettings((s) => ({ ...s, globalPrices: [...s.globalPrices, { name: "", value: "" }] }));
  };

  const upload = async (index: number, file: File) => {
    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await fetch("/api/staff/shop/image", { method: "POST", body: fd });
      if (res.ok) {
        const body = await res.json();
        updateItem(index, { image: body.file });
        flash("success", "Image uploaded.");
      } else {
        const err = await res.json();
        flash("error", err.error || "Upload failed.");
      }
    } catch {
      flash("error", "Network error.");
    }
  };

  const importForum = async () => {
    if (!settings.forumChannel.trim()) {
      flash("error", "Enter the Discord forum channel ID first.");
      return;
    }
    setImporting(true);
    try {
      const res = await fetch("/api/staff/shop/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forumChannel: settings.forumChannel.trim() }),
      });
      if (res.ok) {
        const body = await res.json();
        setItems(body.items);
        setSettings(body.settings);
        if (body.imported > 0) {
          flash("success", `Imported ${body.imported} item${body.imported === 1 ? "" : "s"} from Discord.`);
        } else {
          flash("info", "Nothing new to import — every forum post is already in the shop.");
        }
        if (body.errors && body.errors.length > 0) {
          flash("error", `${body.errors.length} post(s) skipped: ${body.errors.slice(0, 2).join(" · ")}`);
        }
      } else {
        const err = await res.json();
        flash("error", err.error || "Import failed.");
      }
    } catch {
      flash("error", "Network error.");
    } finally {
      setImporting(false);
    }
  };

  const save = async () => {
    for (const it of items) {
      if (!it.name.trim()) {
        flash("error", "Every item needs a name.");
        return;
      }
    }
    setSaving(true);
    try {
      const res = await fetch("/api/staff/shop", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings, items }),
      });
      if (res.ok) {
        flash("success", "Shop saved.");
        const fresh = await fetch("/api/staff/shop");
        if (fresh.ok) {
          const d = await fresh.json();
          setData(d);
          setSettings(d.settings);
          setItems(d.items);
        }
      } else {
        const err = await res.json();
        flash("error", err.error || "Failed to save.");
      }
    } catch {
      flash("error", "Network error.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Skeleton className="h-6 w-56 mb-8" />
        <SkeletonCard className="p-5 mb-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full sm:col-span-2" />
          </div>
        </SkeletonCard>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} className="p-5">
              <Skeleton className="h-28 w-full mb-3" />
              <Skeleton className="h-4 w-1/2 mb-3" />
              <Skeleton className="h-10 w-full" />
            </SkeletonCard>
          ))}
        </div>
      </div>
    );
  }

  if (denied) {
    return (
      <div className="text-center py-40">
        <h1 className="font-display text-2xl tracking-wider text-white mb-3">Access Denied</h1>
        <p className="text-text-muted text-sm mb-6">You don&apos;t have permission to edit the shop.</p>
        <Link href="/staff-panel" className="text-crimson text-sm hover:text-crimson/80 transition-colors">
          Back to Staff Panel
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-40">
        <p className="text-text-muted text-sm">Failed to load shop.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/staff-panel" className="text-text-muted hover:text-white transition-colors text-sm">
            Staff Panel
          </Link>
          <svg className="w-3 h-3 text-text-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/staff-panel/config" className="text-text-muted hover:text-white transition-colors text-sm">
            Config
          </Link>
          <svg className="w-3 h-3 text-text-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-white text-sm">Shop</span>
        </div>
        <h1 className="font-display text-2xl tracking-wider text-white">Shop — Items &amp; Settings</h1>
        <p className="text-text-muted text-xs mt-1.5">
          Manage what appears on the public /shop page. Pull items from a Discord forum channel, or add them manually.
        </p>
      </div>

      {toast && (
        <div
          className={`mb-6 px-4 py-3 rounded-xl text-sm ${
            toast.type === "success"
              ? "bg-green-500/10 border border-green-500/20 text-green-400"
              : toast.type === "error"
                ? "bg-red-500/10 border border-red-500/20 text-red-400"
                : "bg-blue-500/10 border border-blue-500/20 text-blue-400"
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Settings */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{
          background: "linear-gradient(160deg, color-mix(in srgb, var(--color-gold) 5%, transparent) 0%, rgba(255,255,255,0.01) 100%)",
          border: "1px solid color-mix(in srgb, var(--color-gold) 18%, transparent)",
        }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-gold" style={{ background: "color-mix(in srgb, var(--color-gold) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--color-gold) 25%, transparent)" }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.764-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894zM12 15a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-sm tracking-[0.15em] uppercase text-white">Shop Settings</h2>
            <p className="text-[10px] text-text-muted mt-0.5">Currency, notice and the Discord forum source</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelClass}>Discord forum channel ID</label>
            <input
              type="text"
              value={settings.forumChannel}
              onChange={(e) => setSettings({ ...settings, forumChannel: e.target.value })}
              placeholder="e.g. 1234567890123456789"
              className={inputClass}
            />
            <p className="mt-1.5 text-[10px] text-text-muted/60">
              Right-click the forum channel in Discord → Copy Channel ID. Used to pull items.
            </p>
          </div>
          <div>
            <label className={labelClass}>Currency label</label>
            <input
              type="text"
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              placeholder="Credits"
              className={inputClass}
            />
            <p className="mt-1.5 text-[10px] text-text-muted/60">
              Shown next to every price value on the shop page.
            </p>
          </div>
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelClass}>Shop notice</label>
              <label className="flex items-center gap-2 text-[10px] text-text-muted select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.noticeEnabled}
                  onChange={(e) => setSettings({ ...settings, noticeEnabled: e.target.checked })}
                  className="accent-gold"
                />
                Show on shop page
              </label>
            </div>
            <textarea
              value={settings.notice}
              onChange={(e) => setSettings({ ...settings, notice: e.target.value })}
              rows={2}
              placeholder="e.g. Season 2 perks are now live — grab them before they're gone!"
              className={`${inputClass} resize-y`}
            />
          </div>
        </div>

        {/* Global prices */}
        <div className="mb-5">
          <label className={labelClass}>Global prices</label>
          <p className="text-[10px] text-text-muted/60 mb-2 -mt-1">
            Shown on every item that has no prices of its own. Any item with its own prices uses those instead.
          </p>
          {settings.globalPrices.length === 0 ? (
            <p
              className="mb-2 px-3 py-2 rounded-lg text-[11px] text-text-muted"
              style={{ background: "rgba(255,255,255,0.015)", border: "1px dashed rgba(255,255,255,0.06)" }}
            >
              No global prices — add one below.
            </p>
          ) : (
            <div className="space-y-2 mb-2">
              {settings.globalPrices.map((p, pi) => (
                <div key={pi} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={p.value}
                    onChange={(e) => updateGlobalPrice(pi, { value: e.target.value })}
                    placeholder="e.g. 5000"
                    className={`${inputClass} !w-28 shrink-0 text-right font-mono`}
                  />
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => updateGlobalPrice(pi, { name: e.target.value })}
                    placeholder="Label e.g. Car"
                    className={inputClass}
                  />
                  <button
                    onClick={() => removeGlobalPrice(pi)}
                    className="w-8 h-8 shrink-0 rounded-lg bg-red-500/[0.06] border border-red-500/15 text-red-400 hover:bg-red-500/15 flex items-center justify-center transition-all"
                    aria-label="Remove global price"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={addGlobalPrice}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-text-muted hover:text-white transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add global price
          </button>
        </div>

        <button
          onClick={importForum}
          disabled={importing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-gold/30 text-gold text-xs font-medium hover:bg-gold/10 disabled:opacity-50 transition-all"
        >
          {importing ? (
            <span className="w-3.5 h-3.5 border border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--color-gold)" }} />
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          )}
          Pull items from Discord forum
        </button>
        <p className="mt-2 text-[10px] text-text-muted/60">
          Imports every forum post (photo + name) as a shop item. Posts already imported are skipped.
        </p>
      </div>

      {/* Items */}
      <div className="space-y-4 mb-8">
        {items.map((it, i) => (
          <div
            key={it.id}
            className="rounded-2xl p-5"
            style={{
              background: "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-[10px] text-text-muted border border-white/[0.06]">
                {i + 1}
              </span>
              <span className="flex-1 text-[10px] uppercase tracking-wider text-text-muted/60">Item</span>
              {it.source === "forum" && (
                <span className="text-[9px] px-2 py-0.5 rounded-full border border-gold/25 bg-gold/10 text-gold">Forum</span>
              )}
              <label className="flex items-center gap-1.5 text-[10px] text-text-muted select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={it.active}
                  onChange={(e) => updateItem(i, { active: e.target.checked })}
                  className="accent-crimson"
                />
                Visible
              </label>
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] text-text-muted hover:text-white disabled:opacity-25 flex items-center justify-center transition-all"
                aria-label="Move up"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] text-text-muted hover:text-white disabled:opacity-25 flex items-center justify-center transition-all"
                aria-label="Move down"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                onClick={() => remove(i)}
                className="w-8 h-8 rounded-lg bg-red-500/[0.06] border border-red-500/15 text-red-400 hover:bg-red-500/15 flex items-center justify-center transition-all"
                aria-label="Delete item"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex gap-4">
              {/* Image */}
              <div className="w-28 sm:w-32 shrink-0">
                <label className={labelClass}>Photo</label>
                <div
                  className="relative aspect-[4/3] rounded-lg overflow-hidden cursor-pointer group/upload"
                  style={{ border: "1px dashed rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.02)" }}
                  onClick={() => fileInputs.current[String(it.id)]?.click()}
                >
                  {it.image ? (
                    <img src={`/api/shop/image/${encodeURIComponent(it.image)}`} alt={it.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-text-muted/50">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A1.5 1.5 0 0021.75 19.5V4.5A1.5 1.5 0 0020.25 3H3.75A1.5 1.5 0 002.25 4.5v15A1.5 1.5 0 003.75 21z" />
                      </svg>
                      <span className="text-[9px]">Upload</span>
                    </div>
                  )}
                  {it.image && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover/upload:opacity-100 transition-opacity">
                      <span className="text-[10px] text-white font-medium">Change</span>
                    </span>
                  )}
                </div>
                <input
                  ref={(el) => { fileInputs.current[String(it.id)] = el; }}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp,image/bmp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) upload(i, file);
                    e.target.value = "";
                  }}
                />
                {it.image && (
                  <button
                    onClick={() => updateItem(i, { image: "" })}
                    className="mt-1.5 w-full text-[10px] text-text-muted hover:text-red-400 transition-colors"
                  >
                    Remove photo
                  </button>
                )}
              </div>

              {/* Fields */}
              <div className="flex-1 min-w-0 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Name</label>
                    <input
                      type="text"
                      value={it.name}
                      onChange={(e) => updateItem(i, { name: e.target.value })}
                      placeholder="Item name"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Description</label>
                    <input
                      type="text"
                      value={it.description}
                      onChange={(e) => updateItem(i, { description: e.target.value })}
                      placeholder="Short description of the item"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Prices */}
                <div>
                  <label className={labelClass}>Prices</label>
                  <p className="text-[10px] text-text-muted/60 mb-2 -mt-1">
                    Value plus a label (e.g. “Car”). The currency is added automatically from settings.
                  </p>
                  {it.prices.length === 0 ? (
                    <p className="mb-2 px-3 py-2 rounded-lg text-[11px] text-text-muted" style={{ background: "rgba(255,255,255,0.015)", border: "1px dashed rgba(255,255,255,0.06)" }}>
                      No prices of its own — this item shows the global prices.
                    </p>
                  ) : (
                    <div className="space-y-2 mb-2">
                      {it.prices.map((p, pi) => (
                        <div key={pi} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={p.value}
                            onChange={(e) => updatePrice(i, pi, { value: e.target.value })}
                            placeholder="e.g. 5000"
                            className={`${inputClass} !w-28 shrink-0 text-right font-mono`}
                          />
                          <input
                            type="text"
                            value={p.name}
                            onChange={(e) => updatePrice(i, pi, { name: e.target.value })}
                            placeholder="Label e.g. Car"
                            className={inputClass}
                          />
                          <button
                            onClick={() => removePrice(i, pi)}
                            className="w-8 h-8 shrink-0 rounded-lg bg-red-500/[0.06] border border-red-500/15 text-red-400 hover:bg-red-500/15 flex items-center justify-center transition-all"
                            aria-label="Remove price"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => addPrice(i)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-text-muted hover:text-white transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add price
                  </button>
                </div>
                {it.forumUrl && (
                  <a
                    href={it.forumUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[10px] text-text-muted hover:text-gold transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                    </svg>
                    Original Discord post
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="sticky bottom-4 flex items-center gap-3 p-4 rounded-2xl backdrop-blur-md"
        style={{
          background: "rgba(11,11,15,0.85)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <button
          onClick={add}
          className="flex-1 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-sm font-medium hover:bg-white/[0.09] transition-all"
        >
          + Add item manually
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="flex-1 py-3 rounded-xl bg-crimson hover:bg-crimson/80 disabled:opacity-50 text-white text-sm font-semibold transition-all"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}
