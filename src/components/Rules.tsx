"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { categories as baseCategories, allImages } from "@/lib/rules.data";

function CategoryCard({ cat, index }: { cat: typeof baseCategories[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const delay = 0.1 + index * 0.08;

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transition: `all 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      <Link href={`/rules/${cat.slug}`} className="group block relative rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] hover:border-crimson/30 transition-all duration-500">
        {/* Image */}
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={cat.image}
            alt={cat.name}
            className="w-full h-full object-cover brightness-[0.6] group-hover:brightness-[0.75] group-hover:scale-105 transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/40 to-transparent" />

          {/* Corner markers */}
          <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-white/0 group-hover:border-crimson/40 transition-colors duration-500" />
          <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-white/0 group-hover:border-crimson/40 transition-colors duration-500" />

          {/* Rule count badge */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#050507]/70 backdrop-blur-sm border border-white/[0.06]">
            <svg className="w-3 h-3 text-crimson" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-[10px] font-semibold text-text-muted tracking-wider">{cat.rules.length} RULES</span>
          </div>
        </div>

        {/* Content */}
        <div className="relative p-6">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-crimson/0 to-transparent group-hover:via-crimson/30 transition-all duration-700" />

          <h3 className="font-display text-2xl sm:text-3xl tracking-wider mb-2 group-hover:text-gold transition-colors duration-500">
            {cat.name}
          </h3>

          <p className="text-text-muted text-sm leading-relaxed mb-4">
            {cat.rules.slice(0, 3).map((r) => r.title).join(" · ")}
            {cat.rules.length > 3 && " · ..."}
          </p>

          <div className="flex items-center gap-2 text-crimson/70 group-hover:text-crimson transition-colors duration-300">
            <span className="text-[11px] font-semibold tracking-widest uppercase">View Rules</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>

        {/* Hover glow */}
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-crimson/[0.08] rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      </Link>
    </div>
  );
}

export default function Rules() {
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [categories, setCategories] = useState(() =>
    baseCategories.map((cat) => ({ ...cat, image: cat.image }))
  );

  useEffect(() => {
    const imgs = [...allImages];
    for (let i = imgs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
    }
    setCategories(baseCategories.map((cat, i) => ({ ...cat, image: imgs[i % imgs.length] })));
  }, []);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setHeaderVisible(true); },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="rules" className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#050507]" />
        <div className="absolute top-[-30%] left-[20%] w-[800px] h-[600px] bg-crimson/[0.06] rounded-full blur-[180px]" />
        <div className="absolute bottom-[-30%] right-[15%] w-[600px] h-[500px] bg-gold/[0.04] rounded-full blur-[150px]" />
      </div>
      <div className="absolute inset-0 mosaic-pattern pointer-events-none opacity-25" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_20%,#050507_85%)] z-[1]" />

      {/* Header */}
      <div ref={headerRef} className="relative z-10 pt-32 sm:pt-40 pb-20 sm:pb-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div
            style={{
              opacity: headerVisible ? 1 : 0,
              transform: headerVisible ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s",
            }}
          >
            <div className="flex items-center justify-center gap-3 sm:gap-4 mb-10">
              <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent via-crimson/60 to-crimson" />
              <span className="font-display text-[11px] sm:text-xs tracking-[0.4em] text-gold/60 uppercase">Server Rules</span>
              <div className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent via-crimson/60 to-crimson" />
            </div>
            <h2 className="font-display leading-[0.85] tracking-[0.03em]">
              <span className="block text-[2.2rem] sm:text-6xl md:text-7xl lg:text-8xl fire-text">FOLLOW THE</span>
              <span
                className="block text-[3rem] sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] text-text mt-2"
                style={{ textShadow: "0 0 80px rgba(196,30,58,0.12)" }}
              >
                CODE
              </span>
            </h2>
          </div>

          <p
            className="mt-8 text-text-muted text-sm sm:text-base max-w-xl mx-auto leading-relaxed"
            style={{
              opacity: headerVisible ? 1 : 0,
              transform: headerVisible ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s",
            }}
          >
            Choose a category below to view the full rules. Breaking any rule results in sanctions up to a permanent ban.
          </p>
        </div>
      </div>

      {/* Category grid */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 pb-32 sm:pb-40">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {categories.map((cat, i) => (
            <CategoryCard key={cat.slug} cat={cat} index={i} />
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 fire-line z-20" />
    </section>
  );
}
