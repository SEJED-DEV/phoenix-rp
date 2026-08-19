"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";
import SiteConfigAccessPanel from "@/components/SiteConfigAccessPanel";
import {
  BRAND_COLOR_KEYS,
  DEFAULT_BRAND_COLORS,
  DEFAULT_BRANDING,
  isHexColor,
  type BrandColorKey,
  type BrandColors,
  type SiteBranding,
} from "@/lib/site-branding.types";

interface Toast {
  type: "success" | "error" | "info";
  text: string;
}

interface SiteData {
  branding: SiteBranding;
  colorKeys: BrandColorKey[];
  defaults: BrandColors;
  logoUrl: string;
  isOwner: boolean;
  scopes: string[];
}

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-text-muted/30 text-xs focus:outline-none focus:border-crimson/40 transition-all";
const labelClass = "block text-[10px] text-text-muted uppercase tracking-wider mb-1.5";

const COLOR_LABELS: Record<BrandColorKey, string> = {
  crimson: "Crimson",
  "crimson-deep": "Deep Crimson",
  ember: "Ember",
  gold: "Gold",
  "gold-bright": "Bright Gold",
  flame: "Flame",
  bg: "Background",
  "bg-warm": "Warm Background",
  text: "Text",
  "text-dim": "Dim Text",
  "text-muted": "Muted Text",
};

export default function SiteBrandingEditor() {
  const [data, setData] = useState<SiteData | null>(null);
  const [form, setForm] = useState<SiteBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/staff/site")
      .then(async (r) => {
        if (r.status === 403) {
          if (!cancelled) setDenied(true);
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((d: SiteData | null) => {
        if (cancelled || !d) return;
        setData(d);
        setForm({ ...d.branding, colors: { ...d.branding.colors } });
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

  const isOwner = data?.isOwner ?? false;
  const canEditLinks = data?.scopes?.includes("links") ?? false;
  const canEditSite = isOwner || (data?.scopes?.includes("site") ?? false);
  const canEditSomething = canEditLinks || canEditSite;
  const lockedNote = (
    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-crimson/40 bg-crimson/10 text-crimson shrink-0">
      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
      Owner only
    </span>
  );
  const lockedInputClass = `${inputClass} opacity-40 cursor-not-allowed`;

  const setColor = (key: BrandColorKey, value: string) => {
    setForm((f) => (f ? { ...f, colors: { ...f.colors, [key]: value } } : f));
  };

  const previewVars = form
    ? (Object.entries(form.colors).map(([k, v]) => [`--color-${k}`, v]) as [string, string][])
    : [];

  const save = async (next?: SiteBranding) => {
    if (!form || !data) return;
    setSaving(true);
    const payload = next ?? form;
    try {
      const r = await fetch("/api/staff/site", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        flash("error", j.error || "Failed to save branding.");
        return;
      }
      setForm({ ...payload, colors: { ...payload.colors } });
      flash("success", "Branding saved. Changes apply site-wide.");
    } catch {
      flash("error", "Failed to save branding.");
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = () => {
    if (!form) return;
    if (!canEditSite) {
      flash("error", "Only the site owner can reset branding.");
      return;
    }
    save({
      ...DEFAULT_BRANDING,
      siteLogo: form.siteLogo,
    });
  };

  const uploadLogo = async (file: File) => {
    if (!data) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const r = await fetch("/api/staff/site/logo", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        flash("error", j.error || "Upload failed.");
        return;
      }
      setData({ ...data, logoUrl: j.logoUrl });
      setForm((f) => (f ? { ...f, siteLogo: j.storedName } : f));
      flash("success", "Logo updated.");
    } catch {
      flash("error", "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = async () => {
    if (!form || !form.siteLogo) return;
    setSaving(true);
    try {
      const r = await fetch("/api/staff/site/logo", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storedName: form.siteLogo }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        flash("error", j.error || "Failed to remove logo.");
        return;
      }
      setData((d) => (d ? { ...d, logoUrl: "" } : d));
      setForm((f) => (f ? { ...f, siteLogo: "" } : f));
      flash("info", "Logo removed.");
    } catch {
      flash("error", "Failed to remove logo.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Skeleton className="h-3 w-32 mb-3" />
        <Skeleton className="h-6 w-48 mb-8" />
        <div className="grid grid-cols-1 gap-6">
          <SkeletonCard className="p-6">
            <Skeleton className="h-4 w-28 mb-6" />
            <Skeleton className="h-8 w-full mb-2" />
            <Skeleton className="h-8 w-full mb-2" />
            <Skeleton className="h-8 w-full" />
          </SkeletonCard>
        </div>
      </div>
    );
  }

  if (denied || !data || !form) {
    return (
      <div className="text-center py-40">
        <h1 className="font-display text-2xl tracking-wider text-white mb-3">Access Denied</h1>
        <p className="text-text-muted text-sm mb-6">
          Only the site owner or granted editors can edit site branding.
        </p>
        <Link href="/staff-panel/config" className="text-crimson text-sm hover:text-crimson/80 transition-colors">
          Back to Config
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8 stagger-1">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/staff-panel/config" className="text-text-muted hover:text-white transition-colors text-sm">
            Config
          </Link>
          <svg className="w-3 h-3 text-text-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-white text-sm">Site Appearance</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-5 h-px" style={{ background: "linear-gradient(90deg, color-mix(in srgb, var(--color-gold) 80%, transparent), transparent)" }} />
          <span className="text-[10px] font-display tracking-[0.25em] uppercase text-gold">
            {isOwner ? "Owner" : canEditSite ? "Site Branding Editor" : canEditLinks ? "Community Links Editor" : "Site Configuration"}
          </span>
        </div>
        <h1 className="font-display text-2xl tracking-wider text-white">Site Appearance</h1>
        <p className="text-text-muted text-xs mt-1.5">
          {isOwner
            ? "Change the name, tagline, logo and colour palette that visitors see across the entire site — or grant editors for each section below."
            : canEditSite
              ? "You can edit the full site identity — name, tagline, logo, colours and SEO. Changes apply site-wide."
              : "You can edit the Discord invite link and server IP. Identity fields (name, logo, colours, SEO) are locked."}
        </p>
      </div>

      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg text-xs shadow-lg border ${
            toast.type === "success"
              ? "text-[#34d399] border-[#34d399]/25 bg-[#34d399]/10"
              : toast.type === "error"
              ? "text-[#f87171] border-[#f87171]/25 bg-[#f87171]/10"
              : "text-gold border-gold/25 bg-gold/10"
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Live preview */}
      <div
        className="rounded-2xl overflow-hidden mb-6 stagger-2"
        style={{
          ...(Object.fromEntries(previewVars) as Record<string, string>),
          background: "var(--color-bg)",
          border: "1px solid color-mix(in srgb, var(--color-gold) 25%, transparent)",
        }}
      >
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ background: "linear-gradient(90deg, color-mix(in srgb, var(--color-crimson) 12%, transparent), transparent)" }}
        >
          <span className="text-[10px] font-display tracking-[0.25em] uppercase" style={{ color: "var(--color-gold)" }}>
            Live Preview
          </span>
          <span className="text-[10px] text-text-muted">Navbar, footer &amp; pages</span>
        </div>
        <div className="p-6 flex items-center gap-5">
          {data.logoUrl ? (
            <img src={data.logoUrl} alt="" className="w-16 h-16 object-contain rounded-lg" />
          ) : (
            <div
              className="w-16 h-16 rounded-lg flex items-center justify-center font-display text-2xl"
              style={{ background: "color-mix(in srgb, var(--color-crimson) 15%, transparent)", color: "var(--color-gold-bright)" }}
            >
              {(form.siteName.trim().charAt(0) || "P").toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-display text-xl tracking-wider truncate" style={{ color: "var(--color-text)" }}>
              {form.siteName || "Site Name"}
            </p>
            <p className="text-xs mt-1 truncate" style={{ color: "var(--color-text-dim)" }}>
              {form.siteTagline || "Tagline"}
            </p>
          </div>
        </div>
      </div>

      {/* Logo */}
      <div className="rounded-2xl p-6 mb-6 stagger-3" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-display text-sm tracking-[0.15em] uppercase text-white">Logo</h2>
          {!canEditSite && lockedNote}
        </div>
        <div className="flex items-center gap-4">
          {data.logoUrl ? (
            <img src={data.logoUrl} alt="Site logo" className="w-20 h-20 object-contain rounded-lg bg-white/[0.02] border border-white/[0.06] p-2" />
          ) : (
            <div className="w-20 h-20 rounded-lg flex items-center justify-center text-text-muted text-[10px] uppercase tracking-wider bg-white/[0.02] border border-dashed border-white/[0.12]">
              No logo
            </div>
          )}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading || !canEditSite}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-gold border border-gold/25 bg-gold/10 hover:bg-gold/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? "Uploading…" : "Upload logo"}
            </button>
            {form.siteLogo && (
              <button
                onClick={removeLogo}
                disabled={saving || !canEditSite}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-[#f87171] border border-[#f87171]/25 bg-[#f87171]/10 hover:bg-[#f87171]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Remove logo
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".png,.jpg,.jpeg,.gif,.webp,.bmp,image/png,image/jpeg,image/gif,image/webp,image/bmp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadLogo(f);
                e.target.value = "";
              }}
            />
          </div>
          <p className="text-[10px] text-text-muted ml-auto max-w-[220px] text-right">
            PNG, JPG, GIF, WebP or BMP up to 10MB. Rendered in the navbar, footer, hero and favicon.
          </p>
        </div>
      </div>

      {/* Identity */}
      <div className="rounded-2xl p-6 mb-6 stagger-3" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-display text-sm tracking-[0.15em] uppercase text-white">Identity</h2>
          {!canEditSite && lockedNote}
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className={labelClass}>Site name</label>
            <input
              className={isOwner ? inputClass : lockedInputClass}
              value={form.siteName}
              maxLength={60}
              disabled={!canEditSite}
              onChange={(e) => setForm((f) => (f ? { ...f, siteName: e.target.value } : f))}
            />
          </div>
          <div>
            <label className={labelClass}>Tagline</label>
            <input
              className={isOwner ? inputClass : lockedInputClass}
              value={form.siteTagline}
              maxLength={160}
              disabled={!canEditSite}
              onChange={(e) => setForm((f) => (f ? { ...f, siteTagline: e.target.value } : f))}
            />
          </div>
        </div>
      </div>

      {/* Links & SEO */}
      <div className="rounded-2xl p-6 mb-6 stagger-3" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <h2 className="font-display text-sm tracking-[0.15em] uppercase text-white mb-1">Links &amp; SEO</h2>
        <p className="text-text-muted text-[11px] mb-4">These appear across the site — join buttons, connect address and search metadata.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <label className={labelClass}>Discord invite link</label>
              {canEditLinks && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-gold/30 bg-gold/10 text-gold">Links</span>
              )}
            </div>
            <input
              className={canEditLinks ? inputClass : lockedInputClass}
              value={form.discordInvite}
              maxLength={120}
              disabled={!canEditLinks}
              placeholder="https://discord.gg/xxxx"
              onChange={(e) => setForm((f) => (f ? { ...f, discordInvite: e.target.value } : f))}
            />
            <p className="text-[10px] text-text-muted mt-1">Used by the JOIN DISCORD buttons on the homepage, footer, FAQ and departments.</p>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <label className={labelClass}>Server IP (connect address)</label>
              {canEditLinks && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-gold/30 bg-gold/10 text-gold">Links</span>
              )}
            </div>
            <input
              className={canEditLinks ? inputClass : lockedInputClass}
              value={form.serverIp}
              maxLength={80}
              disabled={!canEditLinks}
              placeholder="play.example.com"
              onChange={(e) => setForm((f) => (f ? { ...f, serverIp: e.target.value } : f))}
            />
            <p className="text-[10px] text-text-muted mt-1">Used by the CONNECT button and the connect address in the footer.</p>
          </div>
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2">
              <label className={labelClass}>Meta description</label>
              {!canEditSite && lockedNote}
            </div>
            <input
              className={isOwner ? inputClass : lockedInputClass}
              value={form.metaDescription}
              maxLength={300}
              disabled={!canEditSite}
              onChange={(e) => setForm((f) => (f ? { ...f, metaDescription: e.target.value } : f))}
            />
            <p className="text-[10px] text-text-muted mt-1">Shown in Google search results and link previews.</p>
          </div>
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2">
              <label className={labelClass}>Meta keywords</label>
              {!canEditSite && lockedNote}
            </div>
            <input
              className={isOwner ? inputClass : lockedInputClass}
              value={form.metaKeywords}
              maxLength={300}
              disabled={!canEditSite}
              placeholder="FiveM, Roleplay, ..."
              onChange={(e) => setForm((f) => (f ? { ...f, metaKeywords: e.target.value } : f))}
            />
          </div>
        </div>
      </div>

      {/* Colours */}
      <div className="rounded-2xl p-6 mb-6 stagger-4" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-3 mb-1">
          <h2 className="font-display text-sm tracking-[0.15em] uppercase text-white">Colour Palette</h2>
          {!canEditSite && lockedNote}
        </div>
        <p className="text-text-muted text-[11px] mb-4">These colours drive every accent across the site.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BRAND_COLOR_KEYS.map((key) => {
            const value = form.colors[key];
            const invalid = !isHexColor(value);
            return (
              <div key={key} className="flex items-center gap-3 rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <input
                  type="color"
                  value={isHexColor(value) ? value : "#000000"}
                  disabled={!canEditSite}
                  onChange={(e) => setColor(key, e.target.value)}
                  className="w-9 h-9 rounded-md cursor-pointer border border-white/[0.08] bg-transparent p-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
                />
                <div className="min-w-0 flex-1">
                  <label className="block text-[10px] text-text-muted uppercase tracking-wider">
                    {COLOR_LABELS[key]}
                  </label>
                  <input
                    className={`w-full bg-transparent text-xs font-mono outline-none ${invalid ? "text-[#f87171]" : "text-white"} ${isOwner ? "" : "opacity-40"}`}
                    value={value}
                    disabled={!canEditSite}
                    onChange={(e) => setColor(key, e.target.value)}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (isHexColor(v)) setColor(key, v.toLowerCase());
                    }}
                  />
                </div>
                <button
                  onClick={() => setColor(key, (data.defaults[key] ?? DEFAULT_BRAND_COLORS[key]).toLowerCase())}
                  disabled={!canEditSite}
                  className="text-[10px] text-text-muted hover:text-white transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Reset to default"
                >
                  Reset
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {isOwner && <SiteConfigAccessPanel />}

      {canEditSomething && (
        <div className="flex items-center gap-3 stagger-5">
          <button
            onClick={() => save()}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg text-xs font-medium text-white transition-colors disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, var(--color-crimson), var(--color-ember))" }}
          >
            {saving ? "Saving…" : isOwner ? "Save branding" : canEditSite ? "Save branding" : "Save links"}
          </button>
          {canEditSite && (
            <button
              onClick={resetDefaults}
              disabled={saving}
              className="px-5 py-2.5 rounded-lg text-xs font-medium text-text-muted border border-white/[0.08] hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
            >
              Reset to defaults
            </button>
          )}
        </div>
      )}
    </div>
  );
}
