"use client";

import { useEffect, useRef, useState } from "react";

const departments = [
  {
    name: "Police Department",
    desc: "Protect and serve. Law enforcement keeping the streets safe with full patrol units, investigations, and tactical teams.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    btn: "Join PD",
    btnHref: "https://discord.gg/rapZCCQBv",
  },
  {
    name: "EMS / Medical",
    desc: "First responders saving lives. From ambulance calls to emergency surgery — every second counts.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    btn: "Join EMS",
    btnHref: "https://discord.gg/rapZCCQBv",
  },
  {
    name: "Families / Criminal",
    desc: "The underground runs deep. Build your crew, claim territory, and rise to power in the city.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
      </svg>
    ),
    btn: "Family Application",
    btnHref: "/apply/family",
  },
  {
    name: "Civilian",
    desc: "Live your life. Start a business, own property, build relationships — create your story.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    name: "Mechanic / Jobs",
    desc: "Keep the city running. Repair, customize, and build — legal jobs with real depth.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    btn: "Apply Now",
    btnHref: "https://discord.gg/rapZCCQBv",
  },
  {
    name: "Dept. of Justice",
    desc: "The law has the final word. Courts, judges, attorneys, and the full legal system.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
    btn: "Join DOJ",
    btnHref: "https://discord.gg/rapZCCQBv",
  },
  {
    name: "Staff Team",
    desc: "Help the community grow. Moderate, manage events, and keep the server running smoothly.",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    btn: "Staff Application",
    btnHref: "/apply/staff",
  },
];

export default function Departments() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="departments" ref={sectionRef} className="relative py-32 sm:py-40 lg:py-52 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#050507]" />
        <div className="absolute top-[-25%] right-[15%] w-[800px] h-[600px] bg-crimson/[0.06] rounded-full blur-[170px]" />
        <div className="absolute bottom-[-25%] left-[5%] w-[600px] h-[500px] bg-gold/[0.03] rounded-full blur-[140px]" />
      </div>
      <div className="absolute inset-0 mosaic-pattern pointer-events-none opacity-30" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_20%,#050507_85%)] z-[1]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section tag */}
        <div
          className="flex items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-14"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s",
          }}
        >
          <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent via-crimson/60 to-crimson" />
          <span className="font-display text-[11px] sm:text-xs tracking-[0.4em] text-gold/60 uppercase">What We Offer</span>
          <div className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent via-crimson/60 to-crimson" />
        </div>

        {/* Title */}
        <div
          className="text-center mb-16 sm:mb-24"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(50px)",
            transition: "all 1.2s cubic-bezier(0.16,1,0.3,1) 0.2s",
          }}
        >
          <h2 className="font-display leading-[0.85] tracking-[0.03em]">
            <span className="block text-[2.2rem] sm:text-6xl md:text-7xl lg:text-8xl fire-text">CHOOSE YOUR</span>
            <span
              className="block text-[3rem] sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] text-text mt-2"
              style={{ textShadow: "0 0 80px rgba(196,30,58,0.12)" }}
            >
              PATH
            </span>
          </h2>
        </div>

        {/* Grid */}
        <div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(40px)",
            transition: "all 1s cubic-bezier(0.16,1,0.3,1) 0.4s",
          }}
        >
          {departments.map((d, i) => (
            <div
              key={d.name}
              className="group relative p-8 sm:p-9 rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm hover:border-crimson/30 hover:bg-crimson/[0.04] transition-all duration-600 cursor-default overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-crimson/0 to-transparent group-hover:via-crimson/40 transition-all duration-700" />
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-crimson/[0.08] rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-white/0 group-hover:border-crimson/30 transition-colors duration-500" />
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-white/0 group-hover:border-crimson/30 transition-colors duration-500" />

              <div className="relative">
                <div className="text-ember/70 group-hover:text-gold transition-colors duration-500 mb-5">
                  {d.icon}
                </div>
                <h3 className="font-display text-xl sm:text-2xl tracking-wider mb-3 group-hover:text-gold transition-colors duration-500">
                  {d.name}
                </h3>
                <p className="text-text-muted text-xs sm:text-sm leading-relaxed">{d.desc}</p>
                {d.btn && (
                  <a
                    href={d.btnHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-5 px-4 py-2 text-[11px] font-semibold tracking-widest uppercase rounded-md border border-crimson/30 text-crimson/80 hover:bg-crimson/10 hover:text-crimson hover:border-crimson/50 transition-all duration-300"
                  >
                    {d.btn}
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 fire-line z-20" />
    </section>
  );
}
