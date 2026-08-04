"use client";

import { useEffect, useRef, useState } from "react";

const features = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
    title: "Custom Framework",
    desc: "Built from scratch with optimized performance for deep, immersive roleplay mechanics.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    title: "Active Community",
    desc: "50+ active players, daily roleplay sessions, and a welcoming community for newcomers.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    title: "Events & Updates",
    desc: "Weekly events, seasonal updates, and new content drops that keep the city alive.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: "Full Departments",
    desc: "Police, EMS, Families, Civilian, Mechanics, and Justice — find your role.",
  },
];

const stats = [
  { value: "50+", label: "Active Players" },
  { value: "6", label: "Departments" },
  { value: "24/7", label: "Server Uptime" },
  { value: "1000+", label: "Hours of RP" },
];

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

export default function About() {
  const { ref: sectionRef, visible } = useReveal(0.08);
  const { ref: cardsRef, visible: cardsVisible } = useReveal(0.1);
  const { ref: statsRef, visible: statsVisible } = useReveal(0.15);

  return (
    <section id="about" ref={sectionRef} className="relative py-28 sm:py-36 lg:py-44 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#050507]" />
        <div className="absolute top-[-40%] left-1/2 -translate-x-1/2 w-[1200px] h-[900px] bg-crimson/[0.06] rounded-full blur-[200px]" />
        <div className="absolute bottom-[-30%] left-[10%] w-[700px] h-[600px] bg-ember/[0.035] rounded-full blur-[160px]" />
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-gold/[0.02] rounded-full blur-[120px]" />
      </div>
      <div className="absolute inset-0 mosaic-pattern pointer-events-none opacity-20" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_20%,#050507_85%)] z-[1]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section tag */}
        <div
          className="flex items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
            transition: "all 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s",
          }}
        >
          <div className="h-px w-10 sm:w-16 bg-gradient-to-r from-transparent via-crimson/50 to-crimson" />
          <span className="font-display text-[10px] sm:text-[11px] tracking-[0.5em] text-gold/50 uppercase">About Us</span>
          <div className="h-px w-10 sm:w-16 bg-gradient-to-l from-transparent via-crimson/50 to-crimson" />
        </div>

        {/* Title */}
        <div
          className="text-center mb-8 sm:mb-14"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(40px)",
            transition: "all 1.2s cubic-bezier(0.16,1,0.3,1) 0.2s",
          }}
        >
          <h2 className="font-display leading-[0.82] tracking-[0.04em]">
            <span className="block text-[2.8rem] sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] fire-text">
              BORN FROM
            </span>
            <span
              className="block text-[3.8rem] sm:text-8xl md:text-9xl lg:text-[10rem] xl:text-[12rem] text-text"
              style={{ textShadow: "0 0 100px rgba(196,30,58,0.15), 0 0 200px rgba(232,93,4,0.06)" }}
            >
              FIRE
            </span>
          </h2>
          <div className="mt-6 sm:mt-8 flex justify-center">
            <div
              className="h-px w-20 sm:w-28"
              style={{
                background: "linear-gradient(90deg, transparent, var(--color-crimson), var(--color-ember), var(--color-gold), transparent)",
                opacity: 0.6,
              }}
            />
          </div>
        </div>

        {/* Description */}
        <div
          className="max-w-2xl mx-auto text-center mb-16 sm:mb-24 lg:mb-32"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(24px)",
            transition: "all 1s cubic-bezier(0.16,1,0.3,1) 0.4s",
          }}
        >
          <p className="text-text-dim text-[15px] sm:text-lg md:text-xl leading-[1.9] tracking-wide mb-5">
            Tunisian Phoenix RP is a FiveM roleplay community built on passion,
            authenticity, and the spirit of Tunisia. We deliver immersive roleplay
            experiences across law enforcement, emergency services, civilian life,
            and the underground.
          </p>
          <p className="text-text-muted text-[13px] sm:text-[15px] leading-[1.9] tracking-wide">
            Our server runs on a custom framework with optimized performance,
            ensuring smooth gameplay and deep roleplay mechanics. Whether
            you&apos;re protecting the city, saving lives, or building an
            empire — there&apos;s a place for you here.
          </p>
        </div>

        {/* Feature Cards */}
        <div
          ref={cardsRef}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-16 sm:mb-24 lg:mb-32"
          style={{
            opacity: cardsVisible ? 1 : 0,
            transform: cardsVisible ? "translateY(0)" : "translateY(32px)",
            transition: "all 1s cubic-bezier(0.16,1,0.3,1) 0.1s",
          }}
        >
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group relative p-7 sm:p-8 rounded-2xl border border-white/[0.05] bg-white/[0.02] backdrop-blur-sm overflow-hidden transition-all duration-500 hover:border-crimson/20 hover:bg-crimson/[0.03]"
              style={{
                opacity: cardsVisible ? 1 : 0,
                transform: cardsVisible ? "translateY(0)" : "translateY(20px)",
                transition: `all 0.8s cubic-bezier(0.16,1,0.3,1) ${0.2 + i * 0.1}s`,
              }}
            >
              {/* Top accent */}
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent group-hover:via-crimson/30 transition-all duration-700" />

              {/* Corner markers */}
              <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-white/0 group-hover:border-crimson/25 transition-colors duration-500" />
              <div className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-white/0 group-hover:border-crimson/25 transition-colors duration-500" />

              {/* Glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-crimson/[0.06] rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              <div className="relative">
                <div className="text-ember/60 group-hover:text-gold transition-colors duration-500 mb-4">
                  {f.icon}
                </div>
                <h3 className="font-display text-lg sm:text-xl tracking-wider mb-2.5 group-hover:text-gold transition-colors duration-500">
                  {f.title}
                </h3>
                <p className="text-text-muted text-xs sm:text-[13px] leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div
          ref={statsRef}
          className="relative rounded-2xl border border-white/[0.04] bg-white/[0.015] backdrop-blur-sm overflow-hidden"
          style={{
            opacity: statsVisible ? 1 : 0,
            transform: statsVisible ? "translateY(0)" : "translateY(24px)",
            transition: "all 1s cubic-bezier(0.16,1,0.3,1) 0.1s",
          }}
        >
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-crimson/20 to-transparent" />

          {/* Background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[160px] bg-crimson/[0.03] rounded-full blur-[100px]" />

          <div className="relative grid grid-cols-2 sm:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className="text-center py-9 sm:py-12 relative group"
                style={{
                  opacity: statsVisible ? 1 : 0,
                  transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${0.2 + i * 0.1}s`,
                }}
              >
                {/* Dividers */}
                {i < stats.length - 1 && (
                  <div className="absolute right-0 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-white/[0.06] to-transparent hidden sm:block" />
                )}
                {i < 2 && (
                  <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent sm:hidden" />
                )}

                <div
                  className="font-display fire-text group-hover:scale-105 transition-transform duration-500"
                  style={{ fontSize: "clamp(1.8rem, 4.5vw, 3rem)", marginBottom: 6 }}
                >
                  {s.value}
                </div>
                <div className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-text-muted font-medium">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fire line */}
      <div className="absolute bottom-0 left-0 right-0 fire-line z-20" />
    </section>
  );
}
