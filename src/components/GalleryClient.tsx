"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Image from "next/image";

interface MediaFile {
  name: string;
  isVideo: boolean;
  src: string;
}

interface GalleryItem {
  id: string;
  type: "image" | "video";
  src: string;
}

type FilterMode = "all" | "photos" | "videos";

/* ───────── Lightbox ───────── */
function Lightbox({
  items,
  start,
  onClose,
}: {
  items: GalleryItem[];
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
        <div className="flex items-center gap-3">
          <span className="font-display fire-text" style={{ fontSize: 18 }}>
            {String(idx + 1).padStart(2, "0")}
          </span>
          <div className="w-5 h-px" style={{ background: "linear-gradient(90deg, var(--color-crimson), transparent)" }} />
          <span className="font-display" style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
            {String(items.length).padStart(2, "0")}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-all hover:bg-white/[0.06]"
          style={{ border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <svg className="w-3.5 h-3.5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="gal-lb-body" onClick={(e) => e.stopPropagation()}>
        {items.length > 1 && (
          <button className="gal-lb-nav prev" onClick={prev}>
            <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        )}

        <div className="relative flex items-center justify-center" style={{ width: "100%", height: "100%" }}>
          {item.type === "video" ? (
            <video src={item.src} controls autoPlay style={{ maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto", objectFit: "contain", borderRadius: 2 }} />
          ) : (
            <Image src={item.src} alt="" width={1200} height={800} quality={95} className="max-w-full max-h-full object-contain" priority />
          )}
        </div>

        {items.length > 1 && (
          <button className="gal-lb-nav next" onClick={next}>
            <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}
      </div>

      <div className="gal-lb-bottom" onClick={(e) => e.stopPropagation()}>
        <div className="gal-lb-strip" ref={stripRef}>
          {items.map((it, i) => (
            <button
              key={it.id}
              className={`gal-lb-thumb ${i === idx ? "active" : ""}`}
              onClick={() => setIdx(i)}
            >
              {it.src ? (
                <img src={it.src} alt="" />
              ) : (
                <div className="w-full h-full bg-[#111] flex items-center justify-center">
                  <svg className="w-3 h-3 text-white/20" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────── Filter Bar ───────── */
function FilterBar({ active, onChange }: { active: FilterMode; onChange: (m: FilterMode) => void }) {
  const filters: { key: FilterMode; label: string; count: number }[] = [
    { key: "all", label: "All", count: 0 },
    { key: "photos", label: "Photos", count: 0 },
    { key: "videos", label: "Videos", count: 0 },
  ];

  return (
    <div className="relative z-10 flex items-center gap-2 px-5 sm:px-8 py-4">
      {filters.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={`relative px-4 py-1.5 text-[10px] font-display tracking-[0.15em] uppercase transition-all duration-300 ${
            active === f.key
              ? "text-white"
              : "text-text-muted hover:text-text-dim"
          }`}
          style={{
            background: active === f.key ? "rgba(196,30,58,0.15)" : "transparent",
            border: active === f.key ? "1px solid rgba(196,30,58,0.3)" : "1px solid transparent",
            borderRadius: 2,
          }}
        >
          {f.label}
        </button>
      ))}
      <div className="flex-1" />
      <span className="font-display tracking-[0.1em] text-text-muted/30" style={{ fontSize: 9 }}>
        {active === "all" ? "ALL MEDIA" : active === "photos" ? "PHOTOS" : "VIDEOS"}
      </span>
    </div>
  );
}

/* ───────── Empty State ───────── */
function EmptyState({ filter }: { filter: FilterMode }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-6">
      <div className="relative">
        <div className="w-24 h-24 flex items-center justify-center rounded-sm" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <svg className="w-10 h-10 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
      <div className="text-center">
        <p className="font-display text-xl tracking-[0.25em] text-text-dim">
          NO {filter === "photos" ? "PHOTOS" : filter === "videos" ? "VIDEOS" : "MEDIA"} YET
        </p>
        <p className="text-text-muted text-xs mt-2 tracking-wide">
          {filter === "videos"
            ? "No videos in the collection yet."
            : "Nothing to see here yet."}
        </p>
      </div>
    </div>
  );
}

/* ───────── Main Gallery ───────── */
export default function GalleryClient() {
  const [allItems, setAllItems] = useState<GalleryItem[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [lb, setLb] = useState<number | null>(null);
  const [heroIdx, setHeroIdx] = useState(0);
  const [filter, setFilter] = useState<FilterMode>("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/media").then((r) => {
        if (!r.ok) throw new Error("media fetch failed");
        return r.json() as Promise<MediaFile[]>;
      }),
    ])
      .then(([mediaFiles]) => {
        const local: GalleryItem[] = mediaFiles.map((f) => ({
          id: f.name,
          type: f.isVideo ? "video" : "image",
          src: f.src,
        }));
        setAllItems(local);
        const imageOnly = local.filter((item) => item.type === "image");
        if (imageOnly.length > 0) setHeroIdx(Math.floor(Math.random() * imageOnly.length));
        setReady(true);
      })
      .catch(() => {
        setError(true);
        setReady(true);
      });
  }, []);

  const filteredItems = useMemo(() => {
    if (filter === "all") return allItems;
    if (filter === "photos") return allItems.filter((i) => i.type === "image");
    return allItems.filter((i) => i.type === "video");
  }, [allItems, filter]);

  const isVideo = (item: GalleryItem) => item.type === "video";

  /* Loading state */
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="gal-spin" />
          <span className="font-display tracking-[0.3em] uppercase text-text-muted" style={{ fontSize: 10 }}>Loading</span>
        </div>
      </div>
    );
  }

  /* Error state */
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-bg px-6">
        <div className="w-20 h-20 flex items-center justify-center rounded-sm" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <svg className="w-8 h-8 text-crimson" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="font-display text-lg tracking-[0.2em] text-text-dim">COULDN&apos;T LOAD MEDIA</p>
          <p className="text-text-muted text-xs mt-2">Try refreshing the page.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="hero-btn-secondary"
        >
          <span className="hero-btn-inner" style={{ padding: "10px 20px", fontSize: 10 }}>REFRESH</span>
        </button>
      </div>
    );
  }

  if (allItems.length === 0) {
    return (
      <section className="relative min-h-screen bg-bg pt-28 sm:pt-32 lg:pt-36">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-bg" />
        </div>
        <EmptyState filter="all" />
      </section>
    );
  }

  /* Pick hero — always an image */
  const imageIndices = allItems.map((item, i) => ({ item, i })).filter(({ item }) => item.type === "image");
  const heroItem = imageIndices[heroIdx % imageIndices.length]?.item ?? allItems[0];
  const heroOrigIdx = imageIndices[heroIdx % imageIndices.length]?.i ?? 0;

  /* Build display items based on filter, but keep hero separate */
  const displayItems = filteredItems.filter((_, i) => {
    const origIdx = allItems.indexOf(filteredItems[i]);
    return origIdx !== heroOrigIdx;
  });

  /* Dynamic cell sizing — alternate between tall, wide, and standard */
  const getCellClass = (i: number) => {
    const mod = i % 6;
    if (mod === 0) return "tall";
    if (mod === 3) return "wide";
    return "";
  };

  return (
    <section className="relative min-h-screen bg-bg">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-bg" />
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full blur-[200px]" style={{ background: "rgba(196,30,58,0.04)" }} />
      </div>

      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_15%,#050507_90%)] z-[1]" />

      {/* Hero */}
      <div className="relative z-10 pt-28 sm:pt-32 lg:pt-36">
        <div
          className="gal-hero gal-scanlines"
          onClick={() => {
            const lbIdx = filteredItems.findIndex((item) => item.id === heroItem.id);
            if (lbIdx !== -1) setLb(lbIdx < 0 ? 0 : lbIdx);
          }}
          style={{ animation: "gal-in 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both" }}
        >
          {heroItem.src ? (
            <Image src={heroItem.src} alt="" fill priority className="object-cover" sizes="100vw" />
          ) : null}

          <div className="gal-hero-overlay" />

          <div className="gal-hero-content">
            <div className="gal-hero-tag">
              <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-pulse" />
              Featured
            </div>
            <h1
              className="font-display leading-[0.85] tracking-[0.02em] mb-2"
              style={{ animation: "gal-in 0.7s cubic-bezier(0.16,1,0.3,1) 0.3s both" }}
            >
              <span className="block text-[2.5rem] sm:text-6xl md:text-7xl lg:text-8xl fire-text">CAPTURED</span>
              <span className="block text-[3rem] sm:text-7xl md:text-8xl lg:text-9xl text-white/90">MOMENTS</span>
            </h1>
            <p className="font-display tracking-[0.15em] uppercase text-white/30" style={{ fontSize: 11 }}>
              {allItems.length} {allItems.length === 1 ? "item" : "items"} in collection
            </p>
          </div>

          <div className="absolute top-5 right-6 sm:top-8 sm:right-10 z-10">
            <span className="gal-hero-num font-display">01</span>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <FilterBar active={filter} onChange={setFilter} />

      {/* Section divider */}
      <div className="relative z-10 px-5 sm:px-8">
        <div className="flex items-center gap-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <span className="font-display tracking-[0.15em] text-text-muted" style={{ fontSize: 9 }}>
            {displayItems.length} {displayItems.length === 1 ? "item" : "items"}
          </span>
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(196,30,58,0.3), transparent)" }} />
        </div>
      </div>

      {/* Grid */}
      {displayItems.length > 0 ? (
        <div className="relative z-10 gal-grid">
          {displayItems.map((item, i) => {
            const isVideoType = isVideo(item);

            return (
              <div
                key={item.id}
                className={`gal-cell ${getCellClass(i)}`}
                onClick={() => {
                  const lbIdx = filteredItems.findIndex((fi) => fi.id === item.id);
                  if (lbIdx !== -1) setLb(lbIdx);
                }}
                style={{ animation: `gal-in 0.5s cubic-bezier(0.16,1,0.3,1) ${0.03 * i}s both` }}
              >
                {item.type === "video" && item.src ? (
                  <video src={item.src} muted loop playsInline preload="metadata" className="absolute inset-0 w-full h-full object-cover" />
                ) : item.src ? (
                  <Image
                    src={item.src}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    quality={90}
                    loading={i < 6 ? "eager" : "lazy"}
                    priority={i < 2}
                  />
                ) : (
                  <div className="w-full h-full bg-[#0a0a0a]" />
                )}

                {isVideoType && (
                  <div className="gal-play-badge" style={{ opacity: 0.85, transform: "translate(-50%, -50%) scale(1)" }}>
                    <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                )}

                <div className="gal-cell-vig" />

                <div className="gal-cell-info">
                  <div className="gal-cell-num font-display">
                    {String(filteredItems.findIndex((fi) => fi.id === item.id) + 1).padStart(2, "0")}
                  </div>
                  <div className="gal-cell-label">{isVideoType ? "Video" : "Photo"}</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState filter={filter} />
      )}

      <div className="h-20" />

      {lb !== null && <Lightbox items={filteredItems} start={lb} onClose={() => setLb(null)} />}
    </section>
  );
}
