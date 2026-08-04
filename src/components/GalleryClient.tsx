"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Image from "next/image";

interface MediaFile {
  name: string;
  isVideo: boolean;
  src: string;
}

type FilterMode = "all" | "photos" | "videos";

/* ───────── Lightbox ───────── */
function Lightbox({
  items,
  start,
  onClose,
}: {
  items: MediaFile[];
  start: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(start);
  const stripRef = useRef<HTMLDivElement>(null);
  const item = items[idx];

  const next = useCallback(() => setIdx((i) => (i + 1) % items.length), [items.length]);
  const prev = useCallback(() => setIdx((i) => (i - 1 + items.length) % items.length), [items.length]);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const thumb = strip.children[idx] as HTMLElement | undefined;
    if (thumb) thumb.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [idx]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, next, prev]);

  return (
    <div className="gal-lb" onClick={onClose}>
      <div className="gal-lb-top" onClick={(e) => e.stopPropagation()}>
        <div className="gal-lb-counter">
          {String(idx + 1).padStart(2, "0")}
          <span className="opacity-30 mx-1">/</span>
          {String(items.length).padStart(2, "0")}
        </div>
        <div className="flex items-center gap-3">
          <span className="gal-lb-type">{item.isVideo ? "Video" : "Photo"}</span>
          <button className="gal-lb-close" onClick={onClose} aria-label="Close">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="gal-lb-body" onClick={(e) => e.stopPropagation()}>
        {items.length > 1 && (
          <button className="gal-lb-nav prev" onClick={prev} aria-label="Previous">
            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        )}

        <div className="relative flex items-center justify-center w-full h-full">
          {item.isVideo ? (
            <video key={item.src} src={item.src} controls autoPlay className="gal-lb-media" />
          ) : (
            <Image key={item.src} src={item.src} alt="" width={1600} height={1000} quality={95} className="gal-lb-media" priority />
          )}
        </div>

        {items.length > 1 && (
          <button className="gal-lb-nav next" onClick={next} aria-label="Next">
            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}
      </div>

      {items.length > 1 && (
        <div className="gal-lb-bottom" onClick={(e) => e.stopPropagation()}>
          <div className="gal-lb-strip" ref={stripRef}>
            {items.map((it, i) => (
              <button key={it.name} className={`gal-lb-thumb ${i === idx ? "active" : ""}`} onClick={() => setIdx(i)} aria-label={`Item ${i + 1}`}>
                {it.isVideo ? (
                  <div className="w-full h-full flex items-center justify-center bg-[#0d0d0d]">
                    <svg className="w-3 h-3 text-white/30" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                ) : (
                  <img src={it.src} alt="" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── Loading ───────── */
function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="gal-spin" />
        <span className="font-display tracking-[0.3em] uppercase text-text-muted" style={{ fontSize: 10 }}>Loading</span>
      </div>
    </div>
  );
}

/* ───────── Error ───────── */
function ErrorState() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-bg px-6">
      <div className="w-16 h-16 flex items-center justify-center rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <svg className="w-7 h-7 text-crimson" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="font-display text-lg tracking-[0.2em] text-text-dim">COULDN&apos;T LOAD MEDIA</p>
        <p className="text-text-muted text-xs mt-2">Try refreshing the page.</p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="gal-filter active"
        style={{ cursor: "pointer" }}
      >
        Refresh
      </button>
    </div>
  );
}

/* ───────── Empty ───────── */
function EmptyState({ filter }: { filter: FilterMode }) {
  return (
    <div className="min-h-[45vh] flex flex-col items-center justify-center gap-6 px-6">
      <div className="w-20 h-20 flex items-center justify-center rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <svg className="w-9 h-9 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="font-display text-xl tracking-[0.25em] text-text-dim">
          NO {filter === "photos" ? "PHOTOS" : filter === "videos" ? "VIDEOS" : "MEDIA"} YET
        </p>
        <p className="text-text-muted text-xs mt-2 tracking-wide">
          {filter === "videos" ? "No videos in the collection yet." : "Nothing to see here yet."}
        </p>
      </div>
    </div>
  );
}

/* ───────── Main Gallery ───────── */
export default function GalleryClient() {
  const [items, setItems] = useState<MediaFile[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [lb, setLb] = useState<number | null>(null);
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/media")
      .then((r) => {
        if (!r.ok) throw new Error("media fetch failed");
        return r.json() as Promise<MediaFile[]>;
      })
      .then((media) => {
        setItems(media);
        const images = media.filter((m) => !m.isVideo);
        if (images.length > 0) setFeaturedIdx(Math.floor(Math.random() * images.length));
        setReady(true);
      })
      .catch(() => {
        setError(true);
        setReady(true);
      });
  }, []);

  const counts = useMemo(
    () => ({
      all: items.length,
      photos: items.filter((i) => !i.isVideo).length,
      videos: items.filter((i) => i.isVideo).length,
    }),
    [items],
  );

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((i) => (filter === "photos" ? !i.isVideo : i.isVideo));
  }, [items, filter]);

  const { featured, displayItems } = useMemo(() => {
    const f = filter === "all" && filtered.length > 0 ? filtered[featuredIdx % filtered.length] : null;
    const display = f ? filtered.filter((x) => x.name !== f.name) : filtered;
    return { featured: f, displayItems: display };
  }, [filter, filtered, featuredIdx]);

  /* Scroll reveal — animate cells in as they enter the viewport */
  useEffect(() => {
    if (!ready || !gridRef.current) return;
    const els = Array.from(gridRef.current.querySelectorAll<HTMLElement>(".gal-cell"));
    if (els.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            obs.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [ready, displayItems]);

  const openLb = useCallback(
    (name: string) => {
      const i = filtered.findIndex((x) => x.name === name);
      if (i !== -1) setLb(i);
    },
    [filtered],
  );

  const cellClass = (i: number) => {
    const m = i % 10;
    if (m === 0) return "featured";
    if (m === 2 || m === 7) return "tall";
    if (m === 4) return "wide";
    return "";
  };

  if (!ready) return <LoadingState />;
  if (error) return <ErrorState />;
  if (items.length === 0) {
    return (
      <section className="relative min-h-screen bg-bg">
        <div className="gal-head">
          <GalHeader counts={counts} filter={filter} onChange={setFilter} />
        </div>
        <EmptyState filter={filter} />
      </section>
    );
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-bg">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-bg" />
        <div className="absolute top-[-25%] left-1/2 -translate-x-1/2 w-[900px] h-[700px] rounded-full blur-[220px]" style={{ background: "rgba(196,30,58,0.05)" }} />
      </div>
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_25%,#050507_95%)] z-[1]" />

      {/* Header */}
      <div className="gal-head">
        <GalHeader counts={counts} filter={filter} onChange={setFilter} />
      </div>

      {/* Featured */}
      {featured && (
        <div className="gal-featured">
          <div className="gal-featured-inner" onClick={() => openLb(featured.name)}>
            {featured.isVideo ? (
              <video src={featured.src} muted loop playsInline preload="metadata" />
            ) : (
              <Image src={featured.src} alt="" fill priority sizes="100vw" />
            )}
            <div className="gal-featured-overlay" />
            <div className="gal-featured-content">
              <span className="gal-featured-tag">
                <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-pulse" />
                Featured
              </span>
              <span className="gal-featured-title">
                <span className="block fire-text">CAPTURED</span>
                <span className="block text-white/90">MOMENTS</span>
              </span>
              <span className="gal-featured-meta">
                {counts.all} {counts.all === 1 ? "item" : "items"} in collection
              </span>
            </div>
            <span className="gal-featured-num font-display">01</span>
          </div>
        </div>
      )}

      {/* Grid */}
      {displayItems.length > 0 ? (
        <div className="gal-grid" ref={gridRef}>
          {displayItems.map((item, i) => {
            const m = i % 10;
            return (
              <div
                key={item.name}
                className={`gal-cell ${cellClass(i)}`}
                onClick={() => openLb(item.name)}
                style={{ transitionDelay: `${(m % 5) * 60}ms` }}
              >
                {item.isVideo ? (
                  <video src={item.src} muted loop playsInline preload="metadata" />
                ) : (
                  <Image
                    src={item.src}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    quality={90}
                    loading="lazy"
                  />
                )}

                {item.isVideo && (
                  <div className="gal-play-badge">
                    <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                )}

                <div className="gal-cell-vig" />

                <div className="gal-cell-info">
                  <span className="gal-cell-label">
                    {String(filtered.findIndex((fi) => fi.name === item.name) + 1).padStart(2, "0")}
                  </span>
                  <span className="gal-cell-type">{item.isVideo ? "Video" : "Photo"}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState filter={filter} />
      )}

      <div className="h-24" />

      {lb !== null && <Lightbox items={filtered} start={lb} onClose={() => setLb(null)} />}
    </section>
  );
}

/* ───────── Header ───────── */
function GalHeader({
  counts,
  filter,
  onChange,
}: {
  counts: { all: number; photos: number; videos: number };
  filter: FilterMode;
  onChange: (m: FilterMode) => void;
}) {
  const filters: { key: FilterMode; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "photos", label: "Photos", count: counts.photos },
    { key: "videos", label: "Videos", count: counts.videos },
  ];

  return (
    <header>
      <div className="gal-eyebrow">The Archive</div>
      <h1 className="gal-title">
        <span className="fire-text">CAPTURED</span> <span className="text-white/90">MOMENTS</span>
      </h1>
      <p className="gal-sub">
        Every frame a story — screenshots and clips from the streets of the city.
      </p>

      <div className="gal-filters">
        {filters.map((f) => (
          <button
            key={f.key}
            className={`gal-filter ${filter === f.key ? "active" : ""}`}
            onClick={() => onChange(f.key)}
          >
            {f.label}
            <span className="gal-filter-count">{String(f.count).padStart(2, "0")}</span>
          </button>
        ))}
      </div>
    </header>
  );
}
