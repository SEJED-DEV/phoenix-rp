"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";

interface MediaFile {
  name: string;
  isVideo: boolean;
  src: string;
}

const stackVariants = [
  { rotate: -6, x: -8, y: 4, scale: 0.92, zIndex: 1 },
  { rotate: 3, x: 6, y: -2, scale: 0.95, zIndex: 2 },
  { rotate: -2, x: -4, y: 6, scale: 0.97, zIndex: 3 },
  { rotate: 5, x: 10, y: -4, scale: 1, zIndex: 4 },
];

export default function GalleryPreview() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch("/api/media")
      .then((r) => r.json())
      .then((data: MediaFile[]) => {
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setFiles(shuffled.slice(0, 4));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const display = files.slice(0, 4);

  return (
    <section id="gallery" ref={sectionRef} className="relative py-28 sm:py-36 lg:py-44 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#050507]" />
        <div className="absolute top-[-30%] right-[10%] w-[900px] h-[700px] bg-crimson/[0.05] rounded-full blur-[180px]" />
        <div className="absolute bottom-[-25%] left-[20%] w-[600px] h-[500px] bg-ember/[0.03] rounded-full blur-[140px]" />
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
          <span className="font-display text-[10px] sm:text-[11px] tracking-[0.5em] text-gold/50 uppercase">Gallery</span>
          <div className="h-px w-10 sm:w-16 bg-gradient-to-l from-transparent via-crimson/50 to-crimson" />
        </div>

        {/* Title */}
        <div
          className="text-center mb-14 sm:mb-20"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(32px)",
            transition: "all 1.2s cubic-bezier(0.16,1,0.3,1) 0.2s",
          }}
        >
          <h2 className="font-display leading-[0.85] tracking-[0.03em]">
            <span className="block text-[2.2rem] sm:text-6xl md:text-7xl lg:text-8xl fire-text">
              MOMENTS FROM THE
            </span>
            <span
              className="block text-[3rem] sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] text-text mt-2"
              style={{ textShadow: "0 0 80px rgba(196,30,58,0.1)" }}
            >
              STREETS
            </span>
          </h2>
        </div>

        {/* Stacked photos */}
        {!loaded ? (
          <div className="py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-[1.5px] border-crimson/15 border-t-crimson rounded-full animate-spin" />
              <span className="font-mono text-[9px] tracking-[0.2em] text-text-muted/30 uppercase">Loading</span>
            </div>
          </div>
        ) : display.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/[0.06] rounded-2xl">
            <svg className="w-10 h-10 mx-auto mb-3 text-text-muted/20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-text-dim text-xs tracking-wide">No media yet</p>
          </div>
        ) : (
          <a href="/gallery" className="block">
            <div
              className="relative mx-auto"
              style={{ maxWidth: 560, aspectRatio: "4/3" }}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
            >
              {display.map((file, i) => {
                const v = stackVariants[i] || stackVariants[0];
                const spreadX = hovered ? v.x * 3.5 : v.x;
                const spreadY = hovered ? v.y * 3 : v.y;
                const spreadRotate = hovered ? v.rotate * 2.2 : v.rotate;

                return (
                  <div
                    key={file.name}
                    className="absolute inset-0"
                    style={{
                      zIndex: hovered ? v.zIndex + 10 : v.zIndex,
                      opacity: visible ? 1 : 0,
                      transition: `all 0.7s cubic-bezier(0.16,1,0.3,1) ${0.3 + i * 0.12}s`,
                      transform: `translate(${spreadX}%, ${spreadY}%) rotate(${spreadRotate}deg) scale(${v.scale})`,
                    }}
                  >
                    {/* Photo card */}
                    <div
                      className="relative w-full h-full rounded-lg overflow-hidden"
                      style={{
                        boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {/* White border frame (polaroid feel) */}
                      <div className="absolute inset-0 p-[3%] pb-[10%]">
                        <div className="relative w-full h-full rounded-sm overflow-hidden bg-[#0a0a0a]">
                          {file.isVideo ? (
                            <video
                              src={file.src}
                              muted
                              loop
                              playsInline
                              preload="metadata"
                              className="w-full h-full object-cover"
                              style={{ filter: "brightness(0.85) contrast(1.05) saturate(1.1)" }}
                            />
                          ) : (
                            <Image
                              src={file.src}
                              alt={file.name}
                              fill
                              className="object-cover"
                              sizes="560px"
                              style={{ filter: "brightness(0.85) contrast(1.05) saturate(1.1)" }}
                            />
                          )}

                          {/* Subtle vignette */}
                          <div
                            className="absolute inset-0"
                            style={{
                              background: "radial-gradient(ellipse at center, transparent 40%, rgba(5,5,7,0.4) 100%)",
                            }}
                          />

                          {/* Video play badge */}
                          {file.isVideo && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-crimson/70 backdrop-blur-sm border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card bottom label */}
                      <div className="absolute bottom-[2%] left-0 right-0 text-center">
                        <span className="font-mono text-[8px] tracking-[0.15em] text-white/15 uppercase">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </div>

                      {/* Hover glow */}
                      <div
                        className="absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none"
                        style={{
                          background: "radial-gradient(ellipse at center, rgba(196,30,58,0.08) 0%, transparent 60%)",
                          opacity: hovered ? 0.8 : 0,
                        }}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Shadow beneath the stack */}
              <div
                className="absolute -bottom-4 left-[10%] right-[10%] h-8 rounded-[50%] pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, transparent 70%)",
                  filter: "blur(12px)",
                }}
              />
            </div>

            {/* CTA below stack */}
            <div
              className="flex justify-center mt-12 sm:mt-16"
              style={{
                opacity: visible ? 1 : 0,
                transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1) 0.8s",
              }}
            >
              <div className="hero-btn-secondary">
                <span className="hero-btn-inner" style={{ padding: "12px 22px" }}>
                  <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                  <span>VIEW ALL</span>
                </span>
              </div>
            </div>
          </a>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 fire-line z-20" />
    </section>
  );
}
