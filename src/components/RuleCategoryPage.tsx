"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { allImages, greenzoneImages, noRobberyZoneImages } from "@/lib/rules.data";
import type { RuleCategory } from "@/lib/rules.data";

export default function RuleCategoryPage({ cat }: { cat: RuleCategory }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [displayImage, setDisplayImage] = useState(cat.image);

  useEffect(() => {
    if (cat.slug === "greenzone") {
      setDisplayImage(greenzoneImages[Math.floor(Math.random() * greenzoneImages.length)]);
    } else if (cat.slug === "no-robbery-zone") {
      setDisplayImage(noRobberyZoneImages[Math.floor(Math.random() * noRobberyZoneImages.length)]);
    } else {
      setDisplayImage(allImages[Math.floor(Math.random() * allImages.length)]);
    }
  }, [cat.slug]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[var(--color-bg)]" />
        <div className="absolute top-[-20%] left-[10%] w-[700px] h-[600px] bg-crimson/[0.05] rounded-full blur-[160px]" />
        <div className="absolute bottom-[-20%] right-[10%] w-[600px] h-[500px] bg-gold/[0.03] rounded-full blur-[140px]" />
      </div>
      <div className="absolute inset-0 mosaic-pattern pointer-events-none opacity-20" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_20%,var(--color-bg)_85%)] z-[1]" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8 py-20 sm:py-28">
        {/* Back link */}
        <Link
          href="/rules"
          className="inline-flex items-center gap-2 text-text-muted text-sm hover:text-gold transition-colors mb-12"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Rules
        </Link>

        {/* Hero image + title */}
        <div
          className="relative rounded-2xl overflow-hidden border border-white/[0.06] mb-16"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(30px)",
            transition: "all 1s cubic-bezier(0.16,1,0.3,1) 0.1s",
          }}
        >
          <div className="aspect-[21/6] sm:aspect-[3/1]">
            <img src={displayImage} alt={cat.name} className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)]/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-10">
            <span className="font-display text-4xl sm:text-5xl md:text-6xl fire-text">{cat.name}</span>
            <span className="block text-[11px] text-text-muted mt-2 tracking-wider uppercase">{cat.rules.length} rules</span>
          </div>
        </div>

        {/* Rules list */}
        {cat.rules.length > 0 && (
          <div
            className={cat.rules.length === 1 ? "" : "grid sm:grid-cols-2 gap-x-10 gap-y-1"}
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(30px)",
              transition: "all 1s cubic-bezier(0.16,1,0.3,1) 0.3s",
            }}
          >
            {cat.rules.map((r, ri) => (
              <div key={ri} className={`flex gap-4 py-4 ${cat.rules.length === 1 ? "justify-center" : "border-b border-white/[0.04]"}`}>
                {cat.rules.length === 1 ? (
                  <div className="text-center px-8 py-6 rounded-xl border border-crimson/40 bg-crimson/[0.08]">
                    <span className="font-display text-2xl sm:text-3xl text-crimson font-bold tracking-wide">{r.title}</span>
                    <span className="block text-text-dim text-sm mt-3 leading-relaxed max-w-md">{r.desc}</span>
                  </div>
                ) : (
                  <>
                    <span className="text-crimson/60 font-mono text-[11px] mt-0.5 flex-shrink-0 w-6 text-right">
                      {String(ri + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <span className="font-semibold text-text block mb-1">{r.title}</span>
                      <span className="text-text-dim text-[13px] leading-relaxed">{r.desc}</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Additional images */}
        {cat.images && cat.images.length > 0 && (
          <div
            className="mt-16 space-y-6"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(30px)",
              transition: "all 1s cubic-bezier(0.16,1,0.3,1) 0.5s",
            }}
          >
            <h3 className="font-display text-2xl sm:text-3xl fire-text mb-8">Zone Locations</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {cat.images.map((img, i) => {
                const isObj = typeof img === "object" && img !== null && "src" in img;
                const src = isObj ? (img as { src: string }).src : (img as string);
                const imgName = isObj ? (img as { name: string }).name : null;
                return (
                  <div key={i} className="group relative rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.02] hover:border-crimson/30 transition-all duration-300">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={src}
                        alt={imgName || `${cat.name} reference ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    {imgName && (
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <span className="text-sm font-semibold text-text">{imgName}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Nav between categories */}
        <div className="flex justify-between items-center mt-20 pt-8 border-t border-white/[0.06]">
          {cat.slug !== "general" && (
            <Link href={`/rules/${getPrevSlug(cat.slug)}`} className="flex items-center gap-2 text-text-muted text-sm hover:text-gold transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </Link>
          )}
          {cat.slug !== "ems" && (
            <Link href={`/rules/${getNextSlug(cat.slug)}`} className="flex items-center gap-2 text-text-muted text-sm hover:text-gold transition-colors ml-auto">
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 fire-line z-20" />
    </section>
  );
}

const slugs = ["general", "gang", "police", "robbery", "greenzone", "no-robbery-zone", "ems"];

function getPrevSlug(current: string): string {
  const idx = slugs.indexOf(current);
  return slugs[Math.max(0, idx - 1)];
}

function getNextSlug(current: string): string {
  const idx = slugs.indexOf(current);
  return slugs[Math.min(slugs.length - 1, idx + 1)];
}
