"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useSiteBrand } from "@/contexts/SiteBrandContext";

/* ─────────── Embers (refined) ─────────── */
function Embers() {
  const [embers, setEmbers] = useState<
    { id: number; x: number; delay: number; dur: number; size: number }[]
  >([]);

  useEffect(() => {
    setEmbers(
      Array.from({ length: 28 }, (_, i) => ({
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

/* ─────────── Intro: Photo Reel ─────────── */
function IntroOverlay({ onComplete, siteName }: { onComplete: () => void; siteName: string }) {
  const [media, setMedia] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [phase, setPhase] = useState<"pulse" | "montage" | "settle" | "reveal" | "done">("pulse");
  const [shutterOpen, setShutterOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // Fetch media
  useEffect(() => {
    fetch("/api/media")
      .then((r) => r.json())
      .then((data: { isVideo: boolean; src: string }[]) => {
        if (!mountedRef.current) return;
        const images = data.filter((m) => !m.isVideo).map((m) => m.src);
        const shuffled = [...images].sort(() => Math.random() - 0.5);
        setMedia(shuffled.length > 0 ? shuffled : ["/logo.png"]);
      })
      .catch(() => {
        if (mountedRef.current) setMedia(["/logo.png"]);
      });
    return () => { mountedRef.current = false; };
  }, []);

  // Phase 0 → 1: initial black pulse then montage starts
  useEffect(() => {
    const t = setTimeout(() => {
      if (mountedRef.current) setPhase("montage");
    }, 500);
    return () => clearTimeout(t);
  }, []);

  // Montage: rapidly cycle through images with accelerating pace
  useEffect(() => {
    if (media.length === 0 || phase !== "montage") return;

    let idx = 0;
    const total = Math.min(media.length, 10);

    const tick = () => {
      if (!mountedRef.current) return;
      setCurrentIndex(idx);
      idx++;
      if (idx < total) {
        // Accelerate: starts ~200ms, gets faster down to ~100ms
        const progress = idx / total;
        const delay = 200 - progress * 100 + Math.random() * 30;
        intervalRef.current = setTimeout(tick, delay);
      } else {
        // Montage done — brief pause then settle
        setTimeout(() => {
          if (!mountedRef.current) return;
          setPhase("settle");
          // After settle logo appears, then reveal
          setTimeout(() => {
            if (!mountedRef.current) return;
            setPhase("reveal");
            setShutterOpen(true);
            setTimeout(() => {
              if (!mountedRef.current) return;
              setPhase("done");
              onComplete();
            }, 1000);
          }, 1600);
        }, 250);
      }
    };

    const startTimer = setTimeout(tick, 100);
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
      clearTimeout(startTimer);
    };
  }, [media, onComplete, phase]);

  if (phase === "done") return null;

  const currentSrc = currentIndex >= 0 && currentIndex < media.length ? media[currentIndex] : null;
  const totalImages = Math.min(media.length, 10);

  // Random slide direction for each montage frame
  const slideDirs = ["left", "right", "top", "bottom"] as const;
  const slideDir = currentSrc ? slideDirs[currentIndex % 4] : "left";

  return (
    <div
      className="fixed inset-0 z-[200]"
      style={{
        background: "var(--color-bg)",
        transition: "opacity 1s cubic-bezier(0.16,1,0.3,1)",
        opacity: phase === "reveal" ? 0 : 1,
        pointerEvents: phase === "reveal" ? "none" : "auto",
      }}
    >
      {/* Film grain — always on */}
      <div
        className="absolute inset-0 pointer-events-none z-[60]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px",
          opacity: 0.05,
          mixBlendMode: "overlay",
        }}
      />

      {/* ═══ PHASE 0: Black pulse ═══ */}
      {phase === "pulse" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-4 h-4 rounded-full bg-crimson/30"
            style={{ animation: "intro-pulse-burst 0.5s ease-out forwards" }}
          />
        </div>
      )}

      {/* ═══ PHASE 1: Rapid montage ═══ */}
      {phase === "montage" && currentSrc && (
        <div className="absolute inset-0 overflow-hidden">
          {/* Previous image (stays behind, fades) + Current image slides in */}
          <div
            key={currentIndex}
            className="absolute inset-0"
          >
            {/* The image — slides in from a direction */}
            <div
              className="absolute inset-[-60px]"
              style={{
                backgroundImage: `url(${currentSrc})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "brightness(0.45) contrast(1.15) saturate(0.75)",
                animation: `intro-slide-${slideDir} 0.5s cubic-bezier(0.16,1,0.3,1) forwards, intro-ken-burns-${currentIndex % 3} 2s ease-out forwards`,
              }}
            />
            {/* Vignette */}
            <div
              className="absolute inset-0"
              style={{
                background: "radial-gradient(ellipse at center, transparent 25%, color-mix(in srgb, var(--color-bg) 50%, transparent) 65%, var(--color-bg) 95%)",
              }}
            />
          </div>

          {/* Crimson edge flash (not white — more cinematic) */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at center, color-mix(in srgb, var(--color-crimson) 15%, transparent) 0%, transparent 70%)",
              animation: "intro-crimson-flash 0.25s ease-out forwards",
              zIndex: 5,
            }}
          />

          {/* Horizontal scan line that sweeps down */}
          <div
            className="absolute left-0 right-0 h-[2px] pointer-events-none z-[7]"
            style={{
              background: "linear-gradient(90deg, transparent 10%, color-mix(in srgb, var(--color-crimson) 40%, transparent) 50%, transparent 90%)",
              animation: "intro-scanline-sweep 0.4s linear forwards",
              top: 0,
            }}
          />

          {/* Scanlines overlay */}
          <div
            className="absolute inset-0 pointer-events-none z-[4]"
            style={{
              background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.025) 3px, rgba(0,0,0,0.025) 4px)",
              opacity: 0.7,
            }}
          />

          {/* HUD: Frame counter — bottom left */}
          <div className="absolute bottom-7 left-7 z-10 flex items-center gap-3">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-crimson" style={{ animation: "intro-rec-blink 1s ease-in-out infinite" }} />
              <div className="absolute inset-[-3px] rounded-full border border-crimson/30" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] tracking-[0.15em] text-crimson/60 leading-none">
                {String(currentIndex + 1).padStart(2, "0")}/{String(totalImages).padStart(2, "0")}
              </span>
              <span className="font-mono text-[8px] tracking-wider text-text-muted/30 leading-none mt-0.5">
                FRAMES
              </span>
            </div>
          </div>

          {/* HUD: Timecode — top right */}
          <div className="absolute top-7 right-7 z-10">
            <span className="font-mono text-[10px] tracking-[0.12em] text-text-muted/25">
              {`00:${String(Math.floor(currentIndex * 0.18)).padStart(2, "0")}:${String(Math.floor((currentIndex * 180) % 100)).padStart(2, "0")}`}
            </span>
          </div>

          {/* HUD: "LOADING" — bottom right with animated dots */}
          <div className="absolute bottom-7 right-7 z-10 flex items-center gap-2">
            <span className="font-mono text-[9px] tracking-[0.25em] text-text-muted/30">LOADING</span>
            <div className="flex gap-[3px]">
              {[0, 1, 2].map((d) => (
                <div
                  key={d}
                  className="w-[3px] h-[3px] rounded-full bg-crimson/40"
                  style={{ animation: `intro-dot-pulse 0.8s ease-in-out ${d * 0.15}s infinite` }}
                />
              ))}
            </div>
          </div>

          {/* Progress bar — top */}
          <div className="absolute top-0 left-0 right-0 z-10">
            <div className="h-[2px] bg-white/[0.02]">
              <div
                className="h-full transition-all duration-200 ease-out"
                style={{
                  width: `${((currentIndex + 1) / totalImages) * 100}%`,
                  background: "linear-gradient(90deg, var(--color-crimson-deep), var(--color-crimson), var(--color-ember))",
                  boxShadow: "0 0 8px color-mix(in srgb, var(--color-crimson) 30%, transparent)",
                }}
              />
            </div>
          </div>

          {/* Corner brackets — cinematic frame markers */}
          <div className="absolute inset-8 pointer-events-none z-10">
            {/* TL */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-crimson/20" />
            {/* TR */}
            <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-crimson/20" />
            {/* BL */}
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-crimson/20" />
            {/* BR */}
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-crimson/20" />
          </div>
        </div>
      )}

      {/* ═══ PHASE 2: Settle — final image, logo burn-in ═══ */}
      {phase === "settle" && currentSrc && (
        <div className="absolute inset-0">
          {/* Background image — darkens and holds */}
          <div
            className="absolute inset-[-30px]"
            style={{
              backgroundImage: `url(${currentSrc})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "brightness(0.25) contrast(1.1) saturate(0.6) blur(1px)",
              animation: "intro-settle-zoom 4s cubic-bezier(0.16,1,0.3,1) forwards",
            }}
          />
          {/* Heavy vignette */}
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse at center, color-mix(in srgb, var(--color-bg) 40%, transparent) 0%, color-mix(in srgb, var(--color-bg) 75%, transparent) 50%, var(--color-bg) 90%)",
            }}
          />

          {/* Crimson glow pulse behind logo */}
          <div
            className="absolute inset-0 flex items-center justify-center z-[5]"
            style={{ animation: "intro-glow-expand 1.2s cubic-bezier(0.16,1,0.3,1) 0.1s both" }}
          >
            <div
              className="w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] rounded-full"
              style={{
                background: "radial-gradient(circle, color-mix(in srgb, var(--color-crimson) 20%, transparent) 0%, color-mix(in srgb, var(--color-crimson) 5%, transparent) 40%, transparent 70%)",
              }}
            />
          </div>

          {/* Central logo + text */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="flex flex-col items-center">
              {/* Logo — burn-in effect */}
              <div
                className="relative"
                style={{ animation: "intro-logo-burn 1s cubic-bezier(0.16,1,0.3,1) 0.15s both" }}
              >
                <img
                  src="/api/site/logo"
                  alt=""
                  className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain relative z-[2]"
                  style={{
                    filter: "drop-shadow(0 0 30px color-mix(in srgb, var(--color-crimson) 40%, transparent)) drop-shadow(0 0 60px color-mix(in srgb, var(--color-ember) 15%, transparent))",
                  }}
                />
                {/* Burn glow ring behind logo */}
                <div
                  className="absolute inset-[-30px] rounded-full z-[1]"
                  style={{
                    background: "radial-gradient(circle, color-mix(in srgb, var(--color-crimson) 30%, transparent) 0%, transparent 60%)",
                    animation: "intro-burn-ring 1.5s ease-out 0.3s both",
                  }}
                />
              </div>

              {/* Title — slides up from mask */}
              <div
                className="overflow-hidden mt-5 sm:mt-6"
                style={{ animation: "intro-text-reveal 0.7s cubic-bezier(0.16,1,0.3,1) 0.5s both" }}
              >
                <span
                  className="font-display text-xl sm:text-3xl md:text-4xl tracking-[0.12em] text-text/90 block"
                  style={{ animation: "intro-text-slide-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.5s both" }}
                >
                  {siteName}
                </span>
              </div>

              {/* Separator line — draws itself */}
              <div
                className="h-px mt-3 sm:mt-4"
                style={{
                  background: "linear-gradient(90deg, transparent, var(--color-crimson), var(--color-ember), var(--color-crimson), transparent)",
                  animation: "intro-line-draw 0.6s cubic-bezier(0.16,1,0.3,1) 0.8s both",
                }}
              />

              {/* Subtitle — fades in */}
              <div
                className="overflow-hidden mt-2 sm:mt-3"
                style={{ animation: "intro-text-reveal 0.5s cubic-bezier(0.16,1,0.3,1) 1s both" }}
              >
                <span
                  className="font-display text-[9px] sm:text-[11px] tracking-[0.4em] text-gold/30 block"
                  style={{ animation: "intro-text-slide-up 0.5s cubic-bezier(0.16,1,0.3,1) 1s both" }}
                >
                  ROLEPLAY COMMUNITY
                </span>
              </div>
            </div>
          </div>

          {/* Scanlines */}
          <div
            className="absolute inset-0 pointer-events-none z-20"
            style={{
              background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.02) 3px, rgba(0,0,0,0.02) 4px)",
              opacity: 0.5,
            }}
          />
        </div>
      )}

      {/* ═══ PHASE 3: Shutter reveal ═══ */}
      {phase === "reveal" && (
        <div className="absolute inset-0 z-[30] pointer-events-none">
          {/* Top bar */}
          <div
            className="absolute top-0 left-0 right-0 bg-[var(--color-bg)]"
            style={{
              height: shutterOpen ? "0%" : "50%",
              transition: "height 0.9s cubic-bezier(0.76,0,0.24,1)",
            }}
          />
          {/* Bottom bar */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-[var(--color-bg)]"
            style={{
              height: shutterOpen ? "0%" : "50%",
              transition: "height 0.9s cubic-bezier(0.76,0,0.24,1) 0.04s",
            }}
          />
          {/* Center light burst as shutter opens */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              opacity: shutterOpen ? 0 : 0.6,
              transition: "opacity 0.5s ease-out 0.3s",
            }}
          >
            <div
              className="w-[200vw] h-[2px]"
              style={{
                background: "linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-crimson) 40%, transparent), color-mix(in srgb, var(--color-ember) 30%, transparent), color-mix(in srgb, var(--color-crimson) 40%, transparent), transparent)",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────── Main Hero ─────────── */
export default function Hero() {
  const { branding } = useSiteBrand();
  const [loaded, setLoaded] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleIntroComplete = useCallback(() => {
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

  const heroNameParts = (branding.siteName || "Tunisian Phoenix RP").toUpperCase().split(" ");
  const heroNameFirst = heroNameParts[0] || "TUNISIAN";
  const heroNameSecond = heroNameParts.slice(1).join(" ") || "RP";

  return (
    <>
      <MouseGlow />
      {!introDone && <IntroOverlay onComplete={handleIntroComplete} siteName={branding.siteName} />}

      <style jsx global>{`
        @keyframes ember-rise {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          8% { opacity: 0.9; }
          85% { opacity: 0.3; }
          100% { transform: translateY(-100vh) translateX(15px) scale(0); opacity: 0; }
        }
        @keyframes hero-fade-up {
          0% { opacity: 0; transform: translateY(50px); filter: blur(10px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0px); }
        }
        @keyframes hero-scale-in {
          0% { opacity: 0; transform: scale(0.6); filter: blur(16px); }
          100% { opacity: 1; transform: scale(1); filter: blur(0px); }
        }
        @keyframes line-extend {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        @keyframes logo-glow {
          0%, 100% { filter: drop-shadow(0 0 30px color-mix(in srgb, var(--color-crimson) 30%, transparent)) drop-shadow(0 0 60px color-mix(in srgb, var(--color-ember) 10%, transparent)); }
          50% { filter: drop-shadow(0 0 50px color-mix(in srgb, var(--color-crimson) 50%, transparent)) drop-shadow(0 0 100px color-mix(in srgb, var(--color-ember) 20%, transparent)); }
        }
        @keyframes scroll-bob {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(6px); opacity: 0.9; }
        }
        @keyframes status-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
          50% { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
        }
        @keyframes hero-badge-in {
          0% { opacity: 0; transform: translateY(12px) scale(0.9); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        /* Intro: initial pulse */
        @keyframes intro-pulse-burst {
          0% { transform: scale(0.5); opacity: 0.8; box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-crimson) 50%, transparent); }
          50% { transform: scale(3); opacity: 0.4; box-shadow: 0 0 40px 20px color-mix(in srgb, var(--color-crimson) 15%, transparent); }
          100% { transform: scale(8); opacity: 0; box-shadow: 0 0 80px 40px color-mix(in srgb, var(--color-crimson) 0%, transparent); }
        }

        /* Intro: image slide directions */
        @keyframes intro-slide-left {
          0% { transform: translateX(8%) scale(1.08); opacity: 0; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes intro-slide-right {
          0% { transform: translateX(-8%) scale(1.08); opacity: 0; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes intro-slide-top {
          0% { transform: translateY(6%) scale(1.06); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes intro-slide-bottom {
          0% { transform: translateY(-6%) scale(1.06); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }

        /* Intro: Ken Burns variants */
        @keyframes intro-ken-burns-0 {
          0% { transform: scale(1); }
          100% { transform: scale(1.06) translate(-0.5%, -0.3%); }
        }
        @keyframes intro-ken-burns-1 {
          0% { transform: scale(1); }
          100% { transform: scale(1.05) translate(0.4%, 0.2%); }
        }
        @keyframes intro-ken-burns-2 {
          0% { transform: scale(1.02); }
          100% { transform: scale(1.07) translate(-0.3%, 0.4%); }
        }

        /* Intro: crimson flash */
        @keyframes intro-crimson-flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }

        /* Intro: scanline sweep */
        @keyframes intro-scanline-sweep {
          0% { top: 0%; opacity: 0.8; }
          100% { top: 100%; opacity: 0; }
        }

        /* Intro: REC blink */
        @keyframes intro-rec-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        /* Intro: dot pulse */
        @keyframes intro-dot-pulse {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        /* Intro: settle zoom */
        @keyframes intro-settle-zoom {
          0% { transform: scale(1.02); }
          100% { transform: scale(1.08); }
        }

        /* Intro: glow expand */
        @keyframes intro-glow-expand {
          0% { opacity: 0; transform: scale(0.5); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* Intro: logo burn-in */
        @keyframes intro-logo-burn {
          0% { opacity: 0; transform: scale(0.4); filter: blur(20px) brightness(3); }
          40% { opacity: 1; transform: scale(1.1); filter: blur(4px) brightness(1.8); }
          100% { opacity: 1; transform: scale(1); filter: blur(0px) brightness(1); }
        }

        /* Intro: burn ring */
        @keyframes intro-burn-ring {
          0% { opacity: 0; transform: scale(0.3); }
          50% { opacity: 0.8; transform: scale(1.2); }
          100% { opacity: 0.3; transform: scale(1.5); }
        }

        /* Intro: text reveal (mask) */
        @keyframes intro-text-reveal {
          0% { clip-path: inset(0 0 100% 0); }
          100% { clip-path: inset(0 0 0% 0); }
        }

        /* Intro: text slide up */
        @keyframes intro-text-slide-up {
          0% { transform: translateY(100%); }
          100% { transform: translateY(0); }
        }

        /* Intro: line draw */
        @keyframes intro-line-draw {
          0% { width: 0; opacity: 0; }
          100% { width: 80px; opacity: 1; }
        }
        .hero-video-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: brightness(0.3) contrast(1.1) saturate(0.7);
          z-index: 0;
        }
        .hero-vid-overlay {
          position: absolute;
          inset: 0;
          z-index: 1;
          background:
            linear-gradient(0deg, color-mix(in srgb, var(--color-bg) 100%, transparent) 0%, color-mix(in srgb, var(--color-bg) 50%, transparent) 30%, color-mix(in srgb, var(--color-bg) 20%, transparent) 50%, color-mix(in srgb, var(--color-bg) 60%, transparent) 80%, color-mix(in srgb, var(--color-bg) 95%, transparent) 100%),
            linear-gradient(90deg, color-mix(in srgb, var(--color-bg) 60%, transparent) 0%, transparent 30%, transparent 70%, color-mix(in srgb, var(--color-bg) 60%, transparent) 100%);
        }
      `}</style>

      <section
        ref={sectionRef}
        id="home"
        className="relative h-screen flex flex-col overflow-hidden"
      >
        {/* Background */}
        <div className="hero-bg absolute inset-0 will-change-transform">
          <video
            className="hero-video-bg"
            src="/media/2026-06-21 02-45-36.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
          <div className="absolute inset-0 bg-[var(--color-bg)] -z-10">
            <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-crimson/[0.08] rounded-full blur-[180px]" />
            <div className="absolute bottom-[-25%] left-[15%] w-[600px] h-[500px] bg-ember/[0.04] rounded-full blur-[150px]" />
          </div>
          <div className="hero-vid-overlay" />
        </div>

        <Embers />

        {/* Main Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 pt-20 pb-16 overflow-hidden">
          <div
            className={`max-w-5xl mx-auto w-full text-center flex flex-col items-center ${
              introDone && loaded ? "" : "opacity-0"
            }`}
          >
            {/* Logo */}
            <div
              style={{ animation: introDone && loaded ? "hero-scale-in 1.4s cubic-bezier(0.16,1,0.3,1) 0.1s both" : "none" }}
              className="mb-6 sm:mb-8"
            >
              <div className="relative inline-block group">
                <img
                  src="/api/site/logo"
                  alt={branding.siteName}
                  className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 lg:w-52 lg:h-52 object-contain transition-all duration-700 group-hover:scale-105"
                  style={{ animation: "logo-glow 5s ease-in-out infinite" }}
                />
                <div className="absolute inset-[-14px] sm:inset-[-20px] border border-crimson/[0.1] rounded-full animate-[spin_25s_linear_infinite] group-hover:border-crimson/25 transition-colors duration-700" />
                <div className="absolute inset-[-32px] sm:inset-[-44px] border border-gold/[0.05] rounded-full animate-[spin_35s_linear_infinite_reverse] group-hover:border-gold/12 transition-colors duration-700" />
              </div>
            </div>

            {/* Title */}
            <div style={{ animation: introDone && loaded ? "hero-fade-up 1.1s cubic-bezier(0.16,1,0.3,1) 0.4s both" : "none" }}>
              <h1 className="font-display leading-[0.82] tracking-[0.04em] mb-1">
                <span className="block text-[3.2rem] sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] fire-text">
                  {heroNameFirst}
                </span>
                <span className="block text-[4.2rem] sm:text-8xl md:text-9xl lg:text-[10rem] xl:text-[12rem] text-text" style={{ textShadow: "0 0 80px color-mix(in srgb, var(--color-crimson) 15%, transparent), 0 0 160px color-mix(in srgb, var(--color-ember) 5%, transparent)" }}>
                  {heroNameSecond}
                </span>
              </h1>
            </div>

            {/* RP Accent Line */}
            <div
              className="flex items-center justify-center gap-3 sm:gap-5 mt-3 mb-6"
              style={{ animation: introDone && loaded ? "hero-fade-up 0.8s cubic-bezier(0.16,1,0.3,1) 0.7s both" : "none" }}
            >
              <div
                className="h-px w-14 sm:w-24 bg-gradient-to-r from-transparent via-crimson/60 to-crimson"
                style={{ animation: introDone && loaded ? "line-extend 0.7s cubic-bezier(0.16,1,0.3,1) 1.1s both" : "none", transformOrigin: "center" }}
              />
              <span className="font-display text-xl sm:text-3xl md:text-4xl tracking-[0.6em] text-gold/50">RP</span>
              <div
                className="h-px w-14 sm:w-24 bg-gradient-to-l from-transparent via-crimson/60 to-crimson"
                style={{ animation: introDone && loaded ? "line-extend 0.7s cubic-bezier(0.16,1,0.3,1) 1.1s both" : "none", transformOrigin: "center" }}
              />
            </div>

            {/* Tagline */}
            <div
              style={{ animation: introDone && loaded ? "hero-fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.9s both" : "none" }}
              className="mb-10 sm:mb-12"
            >
              <p className="text-text-dim/60 text-xs sm:text-sm tracking-[0.25em] uppercase">
                Tunisian FiveM Roleplay Community
              </p>
            </div>

            {/* Server Status + CTAs */}
            <div
              className="flex flex-col items-center gap-5 w-full max-w-lg"
              style={{ animation: introDone && loaded ? "hero-fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 1.1s both" : "none" }}
            >
              <div
                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm mb-1"
                style={{ animation: introDone && loaded ? "hero-badge-in 0.5s cubic-bezier(0.16,1,0.3,1) 1.5s both" : "none" }}
              >
                <div className="w-2 h-2 rounded-full bg-green-500" style={{ animation: "status-pulse 2s ease-in-out infinite" }} />
                <span className="text-[10px] sm:text-[11px] tracking-[0.12em] uppercase text-text-muted font-medium">Server Online</span>
                <span className="text-[10px] text-text-dim/30 mx-0.5">|</span>
                <span className="text-[10px] sm:text-[11px] tracking-wide text-text-dim/40 font-mono">{branding.serverIp}</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <a
                  href={branding.discordInvite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hero-btn-primary group flex-1"
                >
                  <span className="hero-btn-inner">
                    <svg className="w-4 h-4 opacity-80 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                    <span>JOIN DISCORD</span>
                  </span>
                </a>

                <a
                  href={`fivem://connect/${branding.serverIp}`}
                  className="hero-btn-secondary group flex-1"
                >
                  <span className="hero-btn-inner">
                    <svg className="w-4 h-4 opacity-70 group-hover:scale-110 group-hover:opacity-100 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                    </svg>
                    <span>CONNECT</span>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom line */}
        <div className="absolute bottom-0 left-0 right-0 fire-line z-20" />

        {/* Scroll indicator */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
          style={{ animation: introDone && loaded ? "hero-fade-up 0.5s cubic-bezier(0.16,1,0.3,1) 2s both" : "none" }}
        >
          <div className="flex flex-col items-center gap-2.5">
            <span className="text-text-muted/25 text-[8px] tracking-[0.3em] uppercase">Scroll</span>
            <div className="w-[18px] h-7 border border-text-muted/12 rounded-full flex justify-center pt-1.5">
              <div
                className="w-0.5 h-1.5 bg-gold/30 rounded-full"
                style={{ animation: "scroll-bob 2.5s ease-in-out infinite" }}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
