"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";
import { DEPT_ACCENTS, DEFAULT_ACCENT, type ConfigData } from "@/components/config/ConfigShared";

export default function ConfigHub() {
  const [data, setData] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/staff/app-config")
      .then(async (r) => (r.ok ? r.json() : null))
      .then((d: ConfigData | null) => {
        if (cancelled || !d) return;
        setData(d);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <Skeleton className="h-3 w-32 mb-3" />
        <Skeleton className="h-6 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <Skeleton className="w-9 h-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-8 w-full" />
            </SkeletonCard>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-40">
        <p className="text-text-muted text-sm">Failed to load configuration.</p>
      </div>
    );
  }

  const depts = data.isHighRank ? data.depts : data.depts.filter((d) => d.editableByMe);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8 stagger-1">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/staff-panel" className="text-text-muted hover:text-white transition-colors text-sm">
            Staff Panel
          </Link>
          <svg className="w-3 h-3 text-text-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-white text-sm">Config</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-5 h-px" style={{ background: "linear-gradient(90deg, color-mix(in srgb, var(--color-gold) 80%, transparent), transparent)" }} />
          <span className="text-[10px] font-display tracking-[0.25em] uppercase text-gold">Site Administration</span>
        </div>
        <h1 className="font-display text-2xl tracking-wider text-white">Application Configuration</h1>
        <p className="text-text-muted text-xs mt-1.5">
          Select a department to manage who edits questions, reviews submissions, and approves applications — or manage the site-wide shop and FAQ content.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {depts.map((dept, i) => {
          const editors = data.editors[dept.slug] || [];
          const viewers = data.viewers[dept.slug] || [];
          const approvers = data.approvers[dept.slug] || [];
          const accent = DEPT_ACCENTS[dept.slug] || DEFAULT_ACCENT;
          return (
            <Link
              key={dept.slug}
              href={`/staff-panel/config/${dept.slug}`}
              className={`group relative rounded-2xl overflow-hidden stagger-${Math.min(i + 2, 5)} transition-colors hover:border-white/10`}
              style={{
                background: "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg, ${accent.color}50, rgba(255,255,255,0.02) 65%, transparent)` }}
              />

              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ color: accent.color, backgroundColor: accent.soft, border: `1px solid ${accent.color}25` }}
                  >
                    {accent.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-sm tracking-[0.15em] uppercase text-white">{dept.label}</h2>
                    <p className="text-[10px] text-text-muted mt-0.5">
                      {data.isHighRank ? "Editors, reviewers &amp; approvers" : "Questions for this department"}
                    </p>
                  </div>
                  <svg
                    className="w-4 h-4 text-text-muted/40 group-hover:text-white transition-colors shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>

                {data.isHighRank ? (
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    <div className="rounded-lg px-3 py-2.5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <p className="text-[9px] uppercase tracking-wider text-text-muted">Editors</p>
                      <p className="text-lg font-display" style={{ color: "#34d399" }}>{editors.length}</p>
                    </div>
                    <div className="rounded-lg px-3 py-2.5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <p className="text-[9px] uppercase tracking-wider text-text-muted">Reviewers</p>
                      <p className="text-lg font-display" style={{ color: "#c084fc" }}>{viewers.length}</p>
                    </div>
                    <div className="rounded-lg px-3 py-2.5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <p className="text-[9px] uppercase tracking-wider text-text-muted">Approvers</p>
                      <p className="text-lg font-display" style={{ color: "#fbbf24" }}>{approvers.length}</p>
                    </div>
                  </div>
                ) : (
                  <p
                    className="mb-5 px-3 py-2.5 rounded-lg text-xs text-text-muted"
                    style={{ background: "rgba(255,255,255,0.015)", border: "1px dashed rgba(255,255,255,0.06)" }}
                  >
                    You can edit the questions for this department.
                  </p>
                )}

                <div className="pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <span className="inline-flex items-center gap-2 text-[11px] font-medium transition-colors" style={{ color: accent.color }}>
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-md" style={{ backgroundColor: `${accent.color}12`, border: `1px solid ${accent.color}20` }}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </span>
                    {data.isHighRank ? "Manage department" : "Edit questions"}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* FAQ editor */}
        {data.canEditContent && (
          <Link
            href="/staff-panel/config/faq"
            className="group relative rounded-2xl overflow-hidden stagger-4 transition-colors hover:border-gold/25"
            style={{
              background: "linear-gradient(160deg, color-mix(in srgb, var(--color-gold) 4%, transparent) 0%, rgba(255,255,255,0.01) 100%)",
              border: "1px solid color-mix(in srgb, var(--color-gold) 15%, transparent)",
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, color-mix(in srgb, var(--color-gold) 50%, transparent), rgba(255,255,255,0.02) 65%, transparent)" }} />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-gold"
                  style={{ background: "color-mix(in srgb, var(--color-gold) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--color-gold) 25%, transparent)" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-sm tracking-[0.15em] uppercase text-white">FAQ</h2>
                  <p className="text-[10px] text-text-muted mt-0.5">Site-wide content</p>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-gold/25 bg-gold/10 text-gold shrink-0">
                  Site-wide
                </span>
              </div>
              <p className="text-text-muted text-xs mb-4">
                Edit the questions and answers shown on the public /faq page. Applies immediately to all visitors.
              </p>
              <span className="inline-flex items-center gap-2 text-[11px] font-medium text-gold transition-colors group-hover:text-gold/80">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-md" style={{ background: "color-mix(in srgb, var(--color-gold) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--color-gold) 20%, transparent)" }}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
                Edit FAQ questions
              </span>
            </div>
          </Link>
        )}

        {/* Shop editor */}
        {data.canEditContent && (
          <Link
            href="/staff-panel/config/shop"
            className="group relative rounded-2xl overflow-hidden stagger-4 transition-colors hover:border-gold/25"
            style={{
              background: "linear-gradient(160deg, color-mix(in srgb, var(--color-gold) 4%, transparent) 0%, rgba(255,255,255,0.01) 100%)",
              border: "1px solid color-mix(in srgb, var(--color-gold) 15%, transparent)",
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, color-mix(in srgb, var(--color-gold) 50%, transparent), rgba(255,255,255,0.02) 65%, transparent)" }} />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-gold"
                  style={{ background: "color-mix(in srgb, var(--color-gold) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--color-gold) 25%, transparent)" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-sm tracking-[0.15em] uppercase text-white">Shop</h2>
                  <p className="text-[10px] text-text-muted mt-0.5">Server store content</p>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-gold/25 bg-gold/10 text-gold shrink-0">
                  Site-wide
                </span>
              </div>
              <p className="text-text-muted text-xs mb-4">
                Manage the items, prices, currency and notice shown on the public /shop page. Items can be pulled from a Discord forum channel.
              </p>
              <span className="inline-flex items-center gap-2 text-[11px] font-medium text-gold transition-colors group-hover:text-gold/80">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-md" style={{ background: "color-mix(in srgb, var(--color-gold) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--color-gold) 20%, transparent)" }}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
                Edit shop
              </span>
            </div>
          </Link>
        )}
        {/* Site Appearance */}
        {data.isSiteOwner || data.canEditLinks ? (
          <Link
            href="/staff-panel/config/site"
            className="group relative rounded-2xl overflow-hidden stagger-4 transition-colors hover:border-crimson/40"
            style={{
              background: "linear-gradient(160deg, color-mix(in srgb, var(--color-crimson) 5%, transparent) 0%, rgba(255,255,255,0.01) 100%)",
              border: "1px solid color-mix(in srgb, var(--color-crimson) 20%, transparent)",
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, color-mix(in srgb, var(--color-crimson) 55%, transparent), rgba(255,255,255,0.02) 65%, transparent)" }} />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-crimson"
                  style={{ background: "color-mix(in srgb, var(--color-crimson) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--color-crimson) 25%, transparent)" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-sm tracking-[0.15em] uppercase text-white">Site Appearance</h2>
                  <p className="text-[10px] text-text-muted mt-0.5">Site-wide branding</p>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-crimson/40 bg-crimson/10 text-crimson shrink-0">
                  {data.isSiteOwner ? "Owner only" : "Links"}
                </span>
              </div>
              <p className="text-text-muted text-xs mb-4">
                Change the site name, tagline, logo and colour palette that visitors see everywhere — navbar, footer, hero and pages.
              </p>
              <span className="inline-flex items-center gap-2 text-[11px] font-medium text-crimson transition-colors group-hover:text-crimson/80">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-md" style={{ background: "color-mix(in srgb, var(--color-crimson) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--color-crimson) 20%, transparent)" }}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
                Edit site appearance
              </span>
            </div>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
