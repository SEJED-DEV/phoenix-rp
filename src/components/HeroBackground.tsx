"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

interface MediaItem {
  name: string;
  isVideo: boolean;
  src: string;
}

const FALLBACK_VIDEO = "/media/2026-06-21%2002-45-36.mp4";
const IMAGE_DWELL_MS = 6000;
const VIDEO_STALL_MS = 12000;
const PLAYLIST_CAP = 15;
const FADE_MS = 1000;
const KEN_BURNS_MS = 9000;

const DIM_FILTER = "brightness(0.3) contrast(1.1) saturate(0.7)";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const fallbackItem: MediaItem = { name: "fallback", isVideo: true, src: FALLBACK_VIDEO };

export default function HeroBackground() {
  const [slots, setSlots] = useState<[MediaItem, MediaItem]>([fallbackItem, fallbackItem]);
  const [active, setActive] = useState(0);
  const [playlistSize, setPlaylistSize] = useState(0);
  const playlistRef = useRef<MediaItem[]>([]);
  const nextIndexRef = useRef(0);
  const startedRef = useRef(false);
  const dwellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceRef = useRef<(() => void) | null>(null);

  const clearTimers = useCallback(() => {
    if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
    if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
    dwellTimerRef.current = null;
    stallTimerRef.current = null;
  }, []);

  const advance = useCallback(() => {
    clearTimers();
    const list = playlistRef.current;
    if (list.length === 0) return;

    const current = slots[active];
    if (list.length === 1 && current.src === list[0].src) return;

    const item = list[nextIndexRef.current % list.length];
    nextIndexRef.current += 1;

    const inactive = active === 0 ? 1 : 0;
    setSlots((prev) => {
      const next: [MediaItem, MediaItem] = [prev[0], prev[1]];
      next[inactive] = item;
      return next;
    });
    setActive(inactive);

    const tick = () => advanceRef.current?.();
    if (item.isVideo) {
      stallTimerRef.current = setTimeout(tick, VIDEO_STALL_MS + FADE_MS);
    } else {
      dwellTimerRef.current = setTimeout(tick, IMAGE_DWELL_MS + FADE_MS);
    }
  }, [active, slots, clearTimers]);

  useEffect(() => {
    advanceRef.current = advance;
  }, [advance]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/media")
      .then((r) => r.json())
      .then((data: MediaItem[]) => {
        if (cancelled || !Array.isArray(data) || data.length === 0 || startedRef.current) return;
        startedRef.current = true;
        playlistRef.current = shuffle(data).slice(0, PLAYLIST_CAP);
        setPlaylistSize(playlistRef.current.length);
        nextIndexRef.current = 0;
        advanceRef.current?.();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      videoRefs.current.forEach((v, i) => {
        if (v && i !== active) v.pause();
      });
    }, FADE_MS + 200);
    return () => clearTimeout(t);
  }, [active]);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes hb-kenburns-a {
          0% { transform: scale(1.06) translate(0.6%, 0.4%); }
          100% { transform: scale(1) translate(0, 0); }
        }
        @keyframes hb-kenburns-b {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.08) translate(-0.8%, -0.5%); }
        }
        .hb-layer {
          will-change: transform, opacity;
          transition-property: opacity, transform;
          transition-duration: ${FADE_MS}ms;
          transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hb-media-a { animation: hb-kenburns-a ${KEN_BURNS_MS}ms cubic-bezier(0.25, 0.6, 0.35, 1) both; }
        .hb-media-b { animation: hb-kenburns-b ${KEN_BURNS_MS}ms cubic-bezier(0.25, 0.6, 0.35, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .hb-media-a, .hb-media-b { animation: none; }
          .hb-layer { transition-duration: 300ms; }
        }
      `}</style>
      {slots.map((item, i) => (
        <div
          key={`${i}-${item.src}`}
          className="hb-layer absolute inset-0"
          style={{
            opacity: active === i ? 1 : 0,
            zIndex: active === i ? 1 : 0,
            transform: active === i ? "scale(1)" : "scale(1.04)",
          }}
        >
          {item.isVideo ? (
            <video
              ref={(el) => {
                videoRefs.current[i] = el;
              }}
              src={item.src}
              autoPlay
              muted
              loop={playlistSize <= 1}
              playsInline
              preload="auto"
              onPlaying={() => {
                if (stallTimerRef.current && active === i) {
                  clearTimeout(stallTimerRef.current);
                  stallTimerRef.current = null;
                }
              }}
              onEnded={() => advanceRef.current?.()}
              onError={() => advanceRef.current?.()}
              className={`hb-media-${i === 0 ? "a" : "b"} absolute inset-0 w-full h-full object-cover`}
              style={{ filter: DIM_FILTER }}
            />
          ) : (
            <Image
              src={item.src}
              alt=""
              fill
              sizes="100vw"
              className={`hb-media-${i === 0 ? "a" : "b"} object-cover`}
              style={{ filter: DIM_FILTER }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
