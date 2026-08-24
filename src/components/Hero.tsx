"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSiteBrand } from "@/contexts/SiteBrandContext";
import HeroBackground from "@/components/HeroBackground";

/* ─────────── Embers ─────────── */
function Embers() {
  const [embers, setEmbers] = useState<
    { id: number; x: number; delay: number; dur: number; size: number }[]
  >([]);

  useEffect(() => {
    setEmbers(
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        x: 10 + Math.random() * 80,
        delay: Math.random() * 12,
        dur: 5 + Math.random() * 8,
        size: 0.8 + Math.random() * 2,
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[3]">
      {embers.map((e) => (
        <div
          key={e.id}
          className="absolute rounded-full"
          style={{
            left: `${e.x}%`,
            bottom: "-4px",
            width: `${e.size}px`,
            height: `${e.size}px`,
            background: e.size > 1.8 ? "var(--color-gold-bright)" : e.size > 1.2 ? "var(--color-flame)" : "var(--color-crimson)",
            boxShadow: `0 0 ${e.size * 5}px ${e.size > 1.6 ? "var(--color-gold-bright)" : "var(--color-flame)"}`,
            animation: `ember-rise ${e.dur}s linear infinite`,
            animationDelay: `${e.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ─────────── Mouse Glow ─────────── */
function MouseGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (glowRef.current) {
        glowRef.current.style.setProperty("--mx", `${e.clientX}px`);
        glowRef.current.style.setProperty("--my", `${e.clientY}px`);
      }
    };
    window.addEventListener("mousemove", h, { passive: true });
    return () => window.removeEventListener("mousemove", h);
  }, []);
  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed inset-0 z-40"
      style={{
        background:
          "radial-gradient(600px circle at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, var(--color-crimson) 4%, transparent), transparent 60%)",
      }}
    />
  );
}

/* ─────────── Intro Flash (once per session, skippable) ─────────── */
const INTRO_KEY = "phx-hero-intro-seen";

function IntroFlash({ onComplete, siteName }: { onComplete: () => void; siteName: string }) {
  useEffect(() => {
    const t = setTimeout(onComplete, 1700);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[200] bg-[var(--color-bg)]">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <img
            src="/api/site/logo"
            alt=""
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
            style={{
              animation: "intro-logo-burn 0.9s cubic-bezier(0.16,1,0.3,1) 0.05s both",
              filter: "drop-shadow(0 0 30px color-mix(in srgb, var(--color-crimson) 40%, transparent))",
            }}
          />
          <div className="overflow-hidden mt-4" style={{ animation: "intro-text-reveal 0.5s cubic-bezier(0.16,1,0.3,1) 0.4s both" }}>
            <span
              className="font-display text-lg sm:text-2xl tracking-[0.15em] text-text/90 block"
              style={{ animation: "intro-text-slide-up 0.5s cubic-bezier(0.16,1,0.3,1) 0.4s both" }}
            >
              {siteName}
            </span>
          </div>
          <div
            className="h-px mt-3 w-32"
            style={{
              background: "linear-gradient(90deg, transparent, var(--color-crimson), transparent)",
              animation: "intro-line-draw 0.5s cubic-bezier(0.16,1,0.3,1) 0.75s both",
            }}
          />
        </div>
      </div>

      <button
        onClick={onComplete}
        className="absolute bottom-6 right-6 font-mono text-[10px] tracking-[0.25em] text-text-muted/50 hover:text-text transition-colors"
        style={{ animation: "intro-text-reveal 0.4s ease-out 0.5s both" }}
      >
        SKIP →
      </button>
    </div>
  );
}

/* ─────────── Main Hero — Cinematic Full-Bleed ─────────── */
export default function Hero() {
  const { branding } = useSiteBrand();
  const [introDone, setIntroDone] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(INTRO_KEY) === "1";
    } catch {}
    if (seen) setIntroDone(true);
  }, []);

  const handleIntroComplete = useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch {}
    setIntroDone(true);
  }, []);

  const handleParallax = useCallback(() => {
    if (!sectionRef.current) return;
    const scroll = window.scrollY;
    const h = sectionRef.current.offsetHeight;
    if (scroll > h) return;
    const ratio = scroll / h;
    const bg = sectionRef.current.querySelector(".hero-bg") as HTMLElement;
    if (bg) {
      bg.style.transform = `translateY(${ratio * 60}px) scale(${1 + ratio * 0.08})`;
    }
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleParallax, { passive: true });
    return () => window.removeEventListener("scroll", handleParallax);
  }, [handleParallax]);

  const words = (branding.siteName || "Tunisian Phoenix RP").toUpperCase().split(" ");
  const firstWord = words[0] || "PHOENIX";
  const restWords = words.slice(1).join(" ") || "RP";
  const hudTag = firstWord;

  return (
    <>
      <MouseGlow />
      {!introDone && <IntroFlash onComplete={handleIntroComplete} siteName={branding.siteName} />}

      <style jsx global>{`
        @keyframes ember-rise {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          8% { opacity: 0.9; }
          85% { opacity: 0.3; }
          100% { transform: translateY(-100vh) translateX(15px) scale(0); opacity: 0; }
        }
        @keyframes hero-fade-up {
          0% { opacity: 0; transform: translateY(36px); filter: blur(8px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0px); }
        }
        @keyframes hero-wipe-in {
          0% { clip-path: inset(0 100% 0 0); }
          100% { clip-path: inset(0 0 0 0); }
        }
        @keyframes scroll-bob {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(6px); opacity: 0.9; }
        }
        @keyframes status-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
          50% { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
        }
        @keyframes hud-rec-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
        @keyframes intro-logo-burn {
          0% { opacity: 0; transform: scale(0.4); filter: blur(20px) brightness(3); }
          40% { opacity: 1; transform: scale(1.1); filter: blur(4px) brightness(1.8); }
          100% { opacity: 1; transform: scale(1); filter: blur(0px) brightness(1); }
        }
        @keyframes intro-text-reveal {
          0% { clip-path: inset(0 0 100% 0); }
          100% { clip-path: inset(0 0 0% 0); }
        }
        @keyframes intro-text-slide-up {
          0% { transform: translateY(100%); }
          100% { transform: translateY(0); }
        }
        @keyframes intro-line-draw {
          0% { transform: scaleX(0); opacity: 0; }
          100% { transform: scaleX(1); opacity: 1; }
        }
        .hero-ghost {
          color: transparent;
          -webkit-text-stroke: 1.5px rgba(245, 240, 232, 0.3);
        }
        @media (max-width: 640px) {
          .hero-ghost { -webkit-text-stroke-width: 1px; }
        }
      `}</style>

      <section ref={sectionRef} id="home" className="relative h-screen flex flex-col overflow-hidden">
        {/* Rotating gallery background */}
        <div className="hero-bg absolute inset-0 will-change-transform">
          <HeroBackground />
        </div>

        {/* Legibility scrims */}
        <div
          className="absolute inset-0 z-[2]"
          style={{
            background:
              "linear-gradient(to top, var(--color-bg) 4%, color-mix(in srgb, var(--color-bg) 72%, transparent) 30%, transparent 62%), linear-gradient(105deg, color-mix(in srgb, var(--color-bg) 85%, transparent) 0%, color-mix(in srgb, var(--color-bg) 35%, transparent) 42%, transparent 68%)",
          }}
        />

        <Embers />

        {/* Film grain */}
        <div
          className="absolute inset-0 pointer-events-none z-[4]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "200px",
            opacity: 0.035,
            mixBlendMode: "overlay",
          }}
        />

        {/* Cinematic HUD frame */}
        <div className="absolute inset-4 sm:inset-6 pointer-events-none z-[5]">
          <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-crimson/25" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-crimson/25" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-crimson/25" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-crimson/25" />
        </div>

        {/* HUD: top-left tag */}
        <div
          className="absolute top-7 sm:top-9 left-7 sm:left-11 z-[6] flex items-center gap-2.5"
          style={{ animation: introDone ? "none" : undefined, opacity: 1 }}
        >
          <div className="relative">
            <div className="w-1.5 h-1.5 rounded-full bg-crimson" style={{ animation: "hud-rec-blink 1.6s ease-in-out infinite" }} />
            <div className="absolute inset-[-3px] rounded-full border border-crimson/30" />
          </div>
          <span className="font-mono text-[9px] tracking-[0.3em] text-text-muted/60">{`${hudTag} // LIVE`}</span>
        </div>

        {/* HUD: top-right IP */}
        <div className="absolute top-7 sm:top-9 right-7 sm:right-11 z-[6] hidden sm:block">
          <span className="font-mono text-[9px] tracking-[0.18em] text-text-muted/40">{branding.serverIp}</span>
        </div>

        {/* Content — anchored bottom-left */}
        <div className="relative z-10 flex-1 flex flex-col justify-end px-6 sm:px-10 lg:px-14 pb-24 sm:pb-28">
          <div key={introDone ? "in" : "wait"} className="max-w-4xl">
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-5" style={{ animation: "hero-fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.15s both" }}>
              <span className="w-8 h-px bg-crimson" />
              <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.4em] text-gold/60 uppercase">FiveM &middot; Serious Roleplay</span>
            </div>

            {/* Title */}
            <h1 className="font-display leading-[0.85] tracking-[0.02em] mb-6">
              <span
                className="block text-[clamp(2.8rem,8vw,7rem)] fire-text"
                style={{ animation: "hero-fade-up 0.9s cubic-bezier(0.16,1,0.3,1) 0.3s both" }}
              >
                {firstWord}
              </span>
              <span
                className="block text-[clamp(2.8rem,8vw,7rem)] hero-ghost mt-1"
                style={{ animation: "hero-wipe-in 1s cubic-bezier(0.16,1,0.3,1) 0.55s both" }}
              >
                {restWords}
              </span>
            </h1>

            {/* Tagline */}
            <p
              className="text-text-dim/60 text-xs sm:text-sm leading-relaxed max-w-xl mb-8 line-clamp-2"
              style={{ animation: "hero-fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.75s both" }}
            >
              {branding.siteTagline}
            </p>

            {/* Status + CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4" style={{ animation: "hero-fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.95s both" }}>
              <a href={branding.discordInvite} target="_blank" rel="noopener noreferrer" className="hero-btn-primary group">
                <span className="hero-btn-inner">
                  <svg className="w-4 h-4 opacity-80 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  <span>JOIN DISCORD</span>
                </span>
              </a>

              <a href={`fivem://connect/${branding.serverIp}`} className="hero-btn-secondary group">
                <span className="hero-btn-inner">
                  <svg className="w-4 h-4 opacity-70 group-hover:scale-110 group-hover:opacity-100 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                  </svg>
                  <span>CONNECT</span>
                </span>
              </a>

              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm sm:ml-2 w-fit">
                <div className="w-2 h-2 rounded-full bg-green-500" style={{ animation: "status-pulse 2s ease-in-out infinite" }} />
                <span className="text-[10px] tracking-[0.12em] uppercase text-text-muted font-medium whitespace-nowrap">Server Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator — bottom-right */}
        <div className="absolute bottom-8 right-8 sm:right-11 z-10 flex-col items-center gap-2 hidden sm:flex" style={{ animation: "hero-fade-up 0.6s ease-out 1.4s both" }}>
          <span className="text-text-muted/30 text-[8px] tracking-[0.3em] uppercase" style={{ writingMode: "vertical-rl" }}>Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-gold/40 to-transparent">
            <div className="w-px h-3 bg-gold/80" style={{ animation: "scroll-bob 2.2s ease-in-out infinite" }} />
          </div>
        </div>

        {/* Bottom line */}
        <div className="absolute bottom-0 left-0 right-0 fire-line z-20" />
      </section>
    </>
  );
}
