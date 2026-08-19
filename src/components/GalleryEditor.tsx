"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/Skeleton";

interface GalleryItem {
  id: string;
  filename: string;
  src: string;
  description: string;
  credits: string;
  isVideo: boolean;
}

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-text-muted/30 text-xs focus:outline-none focus:border-emerald-400/40 transition-all";
const labelClass = "block text-[10px] text-text-muted uppercase tracking-wider mb-1.5";

export default function GalleryEditor() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function fetchItems() {
    try {
      const res = await fetch("/api/staff/gallery");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setToast({ type: "error", text: "Failed to load gallery items." });
    } finally {
      setLoading(false);
    }
  }

  function addItemFromUrl() {
    const url = urlInput.trim();
    if (!url) return;
    if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("/")) {
      setToast({ type: "error", text: "Please enter a valid URL (https://...) or local path (/\u2026)." });
      return;
    }
    const id = `url-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const isVideo = /\.(mp4|webm)(\?|$)/i.test(url);
    setItems((prev) => [...prev, { id, filename: url, src: url, description: "", credits: "", isVideo }]);
    setDirty(true);
    setUrlInput("");
    setToast({ type: "success", text: "Item added. Add a description and credits, then save." });
  }

  function updateItem(index: number, patch: Partial<GalleryItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
    setDirty(true);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = items.map((it) => ({
        filename: it.filename,
        src: it.src,
        description: it.description,
        credits: it.credits,
      }));
      const res = await fetch("/api/staff/gallery", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });
      if (!res.ok) throw new Error("Save failed");
      setDirty(false);
      setToast({ type: "success", text: "Gallery saved." });
    } catch {
      setToast({ type: "error", text: "Failed to save gallery." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <Skeleton className="h-3 w-32 mb-3" />
        <Skeleton className="h-6 w-48 mb-8" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-3">
        <Link href="/staff-panel" className="text-text-muted hover:text-white transition-colors text-sm">Staff Panel</Link>
        <svg className="w-3 h-3 text-text-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <Link href="/staff-panel/config" className="text-text-muted hover:text-white transition-colors text-sm">Config</Link>
        <svg className="w-3 h-3 text-text-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-white text-sm">Gallery</span>
      </div>

      {/* Title */}
      <div className="flex items-center gap-2 mb-2">
        <span className="w-5 h-px" style={{ background: "linear-gradient(90deg, #10b981, transparent)" }} />
        <span className="text-[10px] font-display tracking-[0.25em] uppercase text-emerald-400">Gallery Editor</span>
      </div>
      <h1 className="font-display text-2xl tracking-wider text-white mb-1">Gallery Configuration</h1>
      <p className="text-text-muted text-xs mb-8">
        Add images and videos via URL. Items display in random order on the gallery page.
      </p>

      {/* URL Input */}
      <div className="flex items-center gap-3 mb-8">
        <input
          type="url"
          placeholder="Paste image or video URL..."
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItemFromUrl(); } }}
          className="flex-1 px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-text-muted/30 text-xs focus:outline-none focus:border-emerald-400/40 transition-all"
        />
        <button
          onClick={addItemFromUrl}
          disabled={!urlInput.trim()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all text-white disabled:opacity-30"
          style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add
        </button>
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all text-white disabled:opacity-30"
          style={{ background: dirty ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.03)", border: `1px solid ${dirty ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.06)"}` }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {dirty && (
          <span className="text-[10px] text-amber-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Unsaved changes
          </span>
        )}
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="text-center py-24 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.06)" }}>
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-2xl" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.12)" }}>
            <svg className="w-7 h-7 text-emerald-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
          <p className="text-text-dim text-sm font-display tracking-wider mb-1">NO ITEMS YET</p>
          <p className="text-text-muted text-xs">Paste an image or video URL above to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div
              key={item.id}
              className="rounded-xl overflow-hidden transition-colors"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="flex items-start gap-0">
                {/* Thumbnail */}
                <div className="w-24 h-24 shrink-0 relative m-3 rounded-lg overflow-hidden" style={{ background: "#0d0d0f" }}>
                  {item.isVideo ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white/30" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  ) : (
                    <img src={item.src} alt="" className="w-full h-full object-cover" loading="lazy" />
                  )}
                  <div className="absolute top-1 right-1">
                    <span className="text-[8px] px-1.5 py-0.5 rounded-md font-medium" style={{ background: item.isVideo ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)", color: item.isVideo ? "#fca5a5" : "#6ee7b7" }}>
                      {item.isVideo ? "VIDEO" : "PHOTO"}
                    </span>
                  </div>
                </div>

                {/* Fields */}
                <div className="flex-1 min-w-0 py-3 pr-3">
                  <p className="text-[10px] text-text-muted/50 truncate mb-2 font-mono">{item.src}</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className={labelClass}>Description</label>
                      <textarea
                        value={item.description}
                        onChange={(e) => updateItem(i, { description: e.target.value })}
                        placeholder="Describe this image..."
                        rows={2}
                        className={`${inputClass} resize-none`}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Credits</label>
                      <input
                        type="text"
                        value={item.credits}
                        onChange={(e) => updateItem(i, { credits: e.target.value })}
                        placeholder="e.g. @photographer"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                {/* Delete */}
                <div className="pr-3 pt-3">
                  <button
                    onClick={() => removeItem(i)}
                    className="w-8 h-8 rounded-lg bg-red-500/[0.06] border border-red-500/15 text-red-400 hover:bg-red-500/15 flex items-center justify-center transition-all"
                    title="Remove from gallery"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer info */}
      {items.length > 0 && (
        <p className="text-[10px] text-text-muted/40 mt-4 text-center">
          {items.length} {items.length === 1 ? "item" : "items"} &middot; Shown in random order on the gallery
        </p>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className="px-4 py-3 rounded-xl text-xs font-medium shadow-lg"
            style={{
              background: toast.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
              border: `1px solid ${toast.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
              color: toast.type === "success" ? "#34d399" : "#f87171",
            }}
          >
            {toast.text}
          </div>
        </div>
      )}
    </div>
  );
}
