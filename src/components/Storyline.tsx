"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { STORYLINE_CHAPTERS } from "@/lib/storyline.data";

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVis(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0)" : "translateY(32px)",
        filter: vis ? "blur(0)" : "blur(6px)",
        transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms, filter 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function ParallaxImage({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = (rect.top + rect.height / 2 - vh / 2) / (vh / 2 + rect.height / 2);
      if (imgRef.current) {
        imgRef.current.style.transform = `translateY(${progress * -26}px) scale(1.14)`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <figure className="story-image group" ref={wrapRef}>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
      <div className="story-image-vig" />
      <figcaption className="story-image-cap">{caption}</figcaption>
    </figure>
  );
}

export default function Storyline() {
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const [activeIdx, setActiveIdx] = useState(STORYLINE_CHAPTERS.length - 1);
  const [openSummary, setOpenSummary] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setProgress(max > 0 ? doc.scrollTop / max : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = sectionRefs.current.indexOf(entry.target as HTMLElement);
            if (idx >= 0) setActiveIdx(idx);
          }
        }
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    sectionRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const scrollTo = (idx: number) => {
    sectionRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative overflow-hidden">
      {/* ── Scroll progress ── */}
      <div className="fixed top-0 left-0 right-0 z-[70] h-[3px] bg-transparent pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-crimson via-ember to-gold"
          style={{ width: `${progress * 100}%`, transition: "width 0.1s linear" }}
        />
      </div>

      {/* ── Backdrop ── */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#050507]" />
        <div className="absolute top-[-20%] left-[5%] w-[700px] h-[600px] bg-crimson/[0.05] rounded-full blur-[160px]" />
        <div className="absolute top-[35%] right-[-10%] w-[600px] h-[500px] bg-gold/[0.03] rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[500px] h-[400px] bg-ember/[0.04] rounded-full blur-[130px]" />
      </div>
      <div className="absolute inset-0 mosaic-pattern pointer-events-none opacity-20" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_20%,#050507_85%)] z-[1]" />

      {/* ── Hero ── */}
      <header className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 pt-32 sm:pt-40 pb-10 sm:pb-14 text-center">
        <Reveal>
          <div className="story-eyebrow mb-8">The Story So Far</div>
        </Reveal>

        <h1 className="font-display leading-[0.85] tracking-[0.02em]" aria-label="Storyline">
          {"STORYLINE".split("").map((ch, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="story-letter fire-text"
              style={{ animationDelay: `${120 + i * 80}ms` }}
            >
              {ch}
            </span>
          ))}
        </h1>

        <Reveal delay={600}>
          <p className="text-text-muted text-sm sm:text-base max-w-xl mx-auto mt-8 leading-relaxed">
            From the fall of Los Santos to the false paradise of Roxwood — the story of how it all
            began.
          </p>
        </Reveal>

        <Reveal delay={780}>
          <div className="flex items-center justify-center gap-3 mt-8 text-[10px] tracking-[0.25em] uppercase text-text-muted/70">
            <span>{STORYLINE_CHAPTERS.length} Chapters</span>
            <span className="w-1 h-1 rounded-full bg-crimson" />
            <span>Prologue</span>
          </div>
        </Reveal>

        <Reveal delay={950}>
          <div className="story-scroll-hint mt-10" aria-hidden="true">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7-7-7m14-8l-7 7-7-7" />
            </svg>
          </div>
        </Reveal>
      </header>

      {/* ── Sticky chapter nav ── */}
      <div className="story-nav relative z-20 px-6 pb-2">
        <div className="tk-seg max-w-full overflow-x-auto">
          {STORYLINE_CHAPTERS.map((c, i) => (
            <button
              key={c.id}
              onClick={() => scrollTo(i)}
              className={`tk-seg-item ${activeIdx === i ? "active" : ""}`}
            >
              {c.status === "current" && (
                <span className="w-1.5 h-1.5 rounded-full bg-crimson tk-dot-pulse-red mr-2" />
              )}
              {c.kind === "prologue" ? c.partLabel.toUpperCase() : `${c.partLabel.toUpperCase()} · ${c.title}`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chapters ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8 pb-32 sm:pb-40">
        {STORYLINE_CHAPTERS.map((chapter, i) => {
          const prev = i > 0 ? STORYLINE_CHAPTERS[i - 1] : null;
          const next = i < STORYLINE_CHAPTERS.length - 1 ? STORYLINE_CHAPTERS[i + 1] : null;
          const open = openSummary === i;

          return (
            <section
              key={chapter.id}
              ref={(el) => { sectionRefs.current[i] = el; }}
              id={`story-${chapter.id}`}
              className="relative scroll-mt-36 py-20 sm:py-28 border-t border-white/[0.04] first:border-t-0"
            >
              <div className="story-ghost" aria-hidden="true">{String(i + 1).padStart(2, "0")}</div>

              {/* Chapter header */}
              <Reveal>
                <div className="flex items-center gap-3 mb-6">
                  <span className="font-display text-[11px] tracking-[0.3em] text-crimson uppercase">
                    {chapter.kind === "prologue" ? `PROLOGUE · ${chapter.partLabel}` : chapter.partLabel}
                  </span>
                  {chapter.status === "current" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-crimson/40 bg-crimson/15 text-crimson text-[10px] font-bold tracking-[0.15em] uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-crimson tk-dot-pulse-red" />
                      Current
                    </span>
                  )}
                </div>
              </Reveal>

              <Reveal delay={100}>
                <h2 className="font-display text-4xl sm:text-6xl text-text leading-[0.95] tracking-[0.02em] mb-4">
                  {chapter.title}
                </h2>
              </Reveal>

              <Reveal delay={180}>
                <div className="h-[2px] w-40 bg-gradient-to-r from-crimson via-ember to-transparent mb-12 rounded-full" />
              </Reveal>

              {/* Featured image */}
              <Reveal delay={120} className="mb-12">
                <ParallaxImage
                  src={chapter.image}
                  alt={`${chapter.partLabel} — ${chapter.title}`}
                  caption={`${chapter.partLabel} — ${chapter.title}`}
                />
              </Reveal>

              {/* Scene grid */}
              <div className="grid md:grid-cols-2 gap-5">
                {chapter.scenes.map((scene, s) => (
                  <Reveal
                    key={s}
                    delay={s * 90}
                    className={chapter.scenes.length % 2 === 1 && s === chapter.scenes.length - 1 ? "md:col-span-2" : ""}
                  >
                    <article className="story-scene-card">
                      <span className="story-scene-index" aria-hidden="true">
                        {String(s + 1).padStart(2, "0")}
                      </span>
                      {scene.heading && (
                        <h3 className="font-display text-lg tracking-[0.08em] text-gold-bright uppercase mb-3">
                          {scene.heading}
                        </h3>
                      )}
                      {scene.paragraphs.map((p, k) => (
                        <p
                          key={k}
                          className={`text-text-dim text-[13.5px] leading-[1.9] ${k > 0 ? "mt-3" : ""} ${k === 0 && scene.paragraphs.length > 1 ? "story-scene-open" : ""}`}
                        >
                          {p}
                        </p>
                      ))}
                    </article>
                  </Reveal>
                ))}
              </div>

              {/* Pull quote */}
              <Reveal delay={120}>
                <blockquote className="story-quote mt-12 text-center sm:text-left">
                  &ldquo;{chapter.tagline}&rdquo;
                </blockquote>
              </Reveal>

              {/* Short version */}
              <div className="mt-10">
                <Reveal>
                  <button
                    onClick={() => setOpenSummary(open ? null : i)}
                    className="inline-flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.15em] uppercase text-text-dim hover:text-gold transition-colors"
                  >
                    <span
                      className={`w-7 h-7 flex items-center justify-center rounded-md border transition-all duration-300 ${
                        open ? "border-crimson/50 bg-crimson/10 rotate-45" : "border-white/[0.08]"
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </span>
                    Short Version
                  </button>
                </Reveal>
                <div className={`accordion-body ${open ? "open" : ""}`}>
                  <div>
                    <p className="pl-10 pt-4 text-sm text-text-muted leading-relaxed border-l border-white/[0.06] ml-3">
                      {chapter.summary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Prev / next */}
              <div className="mt-14 pt-8 border-t border-white/[0.04] flex items-center justify-between gap-4">
                {prev ? (
                  <button
                    onClick={() => scrollTo(i - 1)}
                    className="group inline-flex items-center gap-3 text-left hover:text-text transition-colors"
                  >
                    <span className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/[0.08] text-text-muted group-hover:border-crimson/40 group-hover:text-crimson transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </span>
                    <span>
                      <span className="block text-[10px] tracking-[0.2em] uppercase text-text-muted mb-0.5">Previous</span>
                      <span className="block text-sm font-medium text-text-dim group-hover:text-gold transition-colors">
                        {prev.kind === "prologue" ? `${prev.partLabel} — ${prev.title}` : prev.title}
                      </span>
                    </span>
                  </button>
                ) : <span />}
                {next ? (
                  <button
                    onClick={() => scrollTo(i + 1)}
                    className="group inline-flex items-center gap-3 text-right hover:text-text transition-colors"
                  >
                    <span>
                      <span className="block text-[10px] tracking-[0.2em] uppercase text-text-muted mb-0.5">Next</span>
                      <span className="block text-sm font-medium text-text-dim group-hover:text-gold transition-colors">
                        {next.kind === "prologue" ? `${next.partLabel} — ${next.title}` : next.title}
                      </span>
                    </span>
                    <span className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/[0.08] text-text-muted group-hover:border-crimson/40 group-hover:text-crimson transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </button>
                ) : <span />}
              </div>
            </section>
          );
        })}
      </div>

      <div className="absolute bottom-0 left-0 right-0 fire-line z-20" />
    </section>
  );
}
