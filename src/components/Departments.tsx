"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useSiteBrand } from "@/contexts/SiteBrandContext";

interface Dept {
  name: string;
  desc: string;
  icon: React.ReactNode;
  accent: string;
  chips?: string[];
  btn?: string;
  btnHref?: string;
  internal?: boolean;
  featured?: boolean;
  span?: string;
}

const departments: Dept[] = [
  {
    name: "Police Department",
    desc: "Protect and serve. Law enforcement keeping the streets safe with full patrol units, investigations, and tactical teams.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    accent: "#f43f5e",
    chips: ["Patrol Units", "Investigations", "Tactical"],
    btn: "Join PD",
    btnHref: "https://discord.gg/rapZCCQBv",
    featured: true,
    span: "sm:col-span-2",
  },
  {
    name: "EMS / Medical",
    desc: "First responders saving lives. From ambulance calls to emergency surgery — every second counts.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    accent: "#14b8a6",
    chips: ["Ambulance", "Emergency", "Surgery"],
    btn: "Join EMS",
    btnHref: "https://discord.gg/rapZCCQBv",
    featured: true,
  },
  {
    name: "Families / Criminal",
    desc: "The underground runs deep. Build your crew, claim territory, and rise to power in the city.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
      </svg>
    ),
    accent: "#a855f7",
    btn: "Apply",
    btnHref: "/apply/family",
    internal: true,
  },
  {
    name: "Mechanic / Jobs",
    desc: "Keep the city running. Repair, customize, and build — legal jobs with real depth.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    accent: "#f97316",
    btn: "Apply via Discord",
    btnHref: "https://discord.gg/rapZCCQBv",
  },
  {
    name: "Dept. of Justice",
    desc: "The law has the final word. Courts, judges, attorneys, and the full legal system.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
    accent: "#60a5fa",
    btn: "Join DOJ",
    btnHref: "https://discord.gg/rapZCCQBv",
  },
  {
    name: "Staff Team",
    desc: "Help the community grow. Moderate, manage events, and keep the server running smoothly.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    accent: "#eab308",
    btn: "Apply",
    btnHref: "/apply/staff",
    internal: true,
    span: "lg:col-span-2",
  },
  {
    name: "Civilian",
    desc: "Live your life. Start a business, own property, build relationships — create your story.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    accent: "#94a3b8",
  },
];

function DeptCard({ d, index }: { d: Dept; index: number }) {
  const stagger = Math.min(index + 1, 5);
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 p-7 sm:p-8 ${d.span || ""} stagger-${stagger}`}
      style={
        {
          "--accent": d.accent,
          "--accent-soft": `${d.accent}3d`,
          "--accent-glow": `${d.accent}1f`,
          background: d.featured
            ? `linear-gradient(160deg, ${d.accent}14 0%, rgba(255,255,255,0.015) 60%)`
            : undefined,
        } as CSSProperties
      }
    >
      {/* Top hairline */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-[var(--accent-soft)] transition-all duration-700" />
      {/* Hover glow */}
      <div
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 50%, var(--accent-glow) 0%, transparent 70%)" }}
      />
      {/* Corner brackets */}
      <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-white/10 group-hover:border-[var(--accent-soft)] transition-colors duration-500" />
      <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-white/10 group-hover:border-[var(--accent-soft)] transition-colors duration-500" />
      {/* Watermark number */}
      <span className="absolute top-4 right-6 font-display text-5xl leading-none text-white/[0.04] group-hover:text-white/[0.09] transition-colors duration-500 select-none">
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="relative flex flex-col h-full">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 border transition-all duration-500 group-hover:scale-105"
          style={{ color: "var(--accent)", borderColor: "var(--accent-soft)", background: "var(--accent-glow)" }}
        >
          {d.icon}
        </div>

        <h3 className="font-display text-xl sm:text-2xl tracking-wider mb-3 group-hover:text-[var(--accent)] transition-colors duration-500">
          {d.name}
        </h3>
        <p className="text-text-muted text-xs sm:text-sm leading-relaxed">{d.desc}</p>

        {d.featured && d.chips && (
          <div className="flex flex-wrap gap-2 mt-5">
            {d.chips.map((c) => (
              <span
                key={c}
                className="text-[10px] px-2.5 py-1 rounded-full font-medium tracking-wide"
                style={{ color: "var(--accent)", background: "var(--accent-glow)", border: "1px solid var(--accent-soft)" }}
              >
                {c}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-7">
          {d.btn ? (
            d.internal ? (
              <Link
                href={d.btnHref!}
                className={`inline-flex items-center gap-2 px-5 py-2.5 text-[11px] font-semibold tracking-widest uppercase rounded-lg border transition-all duration-300 text-[var(--accent)] border-[var(--accent-soft)] hover:bg-[var(--accent-soft)] ${d.featured ? "hover:-translate-y-0.5" : ""}`}
              >
                {d.btn}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            ) : (
              <a
                href={d.btnHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-5 py-2.5 text-[11px] font-semibold tracking-widest uppercase rounded-lg border transition-all duration-300 text-[var(--accent)] border-[var(--accent-soft)] hover:bg-[var(--accent-soft)] ${d.featured ? "hover:-translate-y-0.5" : ""}`}
              >
                {d.btn}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            )
          ) : (
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase text-text-muted/70">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              Always open
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Departments() {
  const { branding } = useSiteBrand();
  const depts = departments.map((d) =>
    d.btnHref === "https://discord.gg/rapZCCQBv" ? { ...d, btnHref: branding.discordInvite } : d
  );
  return (
    <section id="departments" className="relative py-20 sm:py-28 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[var(--color-bg)]" />
        <div className="absolute top-[-25%] right-[15%] w-[800px] h-[600px] bg-crimson/[0.06] rounded-full blur-[170px]" />
        <div className="absolute bottom-[-25%] left-[5%] w-[600px] h-[500px] bg-gold/[0.03] rounded-full blur-[140px]" />
      </div>
      <div className="absolute inset-0 mosaic-pattern pointer-events-none opacity-30" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_20%,var(--color-bg)_85%)] z-[1]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-8 stagger-1">
            <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent via-crimson/60 to-crimson" />
            <span className="font-display text-[11px] sm:text-xs tracking-[0.4em] text-gold/60 uppercase">What We Offer</span>
            <div className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent via-crimson/60 to-crimson" />
          </div>

          <h1 className="font-display leading-[0.85] tracking-[0.03em] stagger-2">
            <span className="block text-[2.2rem] sm:text-6xl md:text-7xl fire-text">CHOOSE YOUR</span>
            <span
              className="block text-[3rem] sm:text-7xl md:text-8xl text-text mt-3"
              style={{ textShadow: "0 0 80px color-mix(in srgb, var(--color-crimson) 12%, transparent)" }}
            >
              PATH
            </span>
          </h1>

          <p className="text-text-muted text-sm sm:text-base leading-relaxed mt-8 stagger-3">
            Every story begins with a choice. Join a department, run a family, or write your own —
            find the path that fits your ambition in the city.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {depts.map((d, i) => (
            <DeptCard key={d.name} d={d} index={i} />
          ))}
        </div>

        {/* Closing callout */}
        <div className="mt-14 sm:mt-20 text-center stagger-1">
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-gold/70 animate-pulse" />
            <p className="text-text-muted text-xs sm:text-sm">
              Not sure yet? Join the community and ask — our staff will point you in the right direction.
            </p>
            <a
              href={branding.discordInvite}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-semibold tracking-widest uppercase rounded-lg border border-gold/30 text-gold/80 hover:bg-gold/10 hover:text-gold hover:border-gold/50 transition-all duration-300"
            >
              Join Discord
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 fire-line z-20" />
    </section>
  );
}
