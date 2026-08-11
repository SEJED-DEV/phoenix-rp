"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface VideoPlayerProps {
  src: string;
  className?: string;
  onExpand?: () => void;
}

export default function VideoPlayer({ src, className, onExpand }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [barVisible, setBarVisible] = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => { if (v.duration) setProgress((v.currentTime / v.duration) * 100); };
    const onMeta = () => setDuration(v.duration);
    const onEnd = () => { setPlaying(false); setBarVisible(true); };
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("ended", onEnd);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("ended", onEnd);
    };
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setBarVisible(true);
    if (playing) {
      timerRef.current = setTimeout(() => setBarVisible(false), 2500);
    }
  }, [playing]);

  useEffect(() => {
    if (!playing) setBarVisible(true);
  }, [playing]);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onCanPlay = () => {
      v.play().then(() => setPlaying(true)).catch(() => {});
    };
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("canplay", onCanPlay, { once: true });
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("canplay", onCanPlay);
    };
  }, []);

  const scrub = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const v = videoRef.current;
    const bar = e.currentTarget;
    if (!v || !bar) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = pct * v.duration;
    setProgress(pct * 100);
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`relative group/v ${className ?? ""}`}
      onMouseMove={resetTimer}
      onMouseLeave={() => playing && setBarVisible(false)}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        muted
        autoPlay
        loop
        playsInline
        preload="metadata"
        onClick={toggle}
      />

      {/* Center play — only when paused */}
      {!playing && (
        <button onClick={toggle} className="absolute inset-0 flex items-center justify-center z-10">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300"
            style={{
              background: "color-mix(in srgb, var(--color-crimson) 75%, transparent)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      )}

      {/* Bottom bar */}
      <div
        className="absolute bottom-0 left-0 right-0 transition-opacity duration-300 z-20"
        style={{
          opacity: barVisible ? 1 : 0,
          pointerEvents: barVisible ? "auto" : "none",
          background: "linear-gradient(to top, color-mix(in srgb, var(--color-bg) 85%, transparent) 0%, transparent 100%)",
          padding: "32px 12px 10px",
        }}
      >
        {/* Progress */}
        <div
          className="w-full rounded-full cursor-pointer mb-1.5"
          style={{ height: 3, background: "rgba(255,255,255,0.12)" }}
          onClick={scrub}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: "var(--color-crimson)",
              transition: "width 75ms",
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>
            {duration ? fmt(videoRef.current?.currentTime ?? 0) : "0:00"} / {duration ? fmt(duration) : "0:00"}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={toggle} className="w-6 h-6 flex items-center justify-center rounded" style={{ color: "rgba(255,255,255,0.5)" }}>
              {playing ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
              ) : (
                <svg className="w-3 h-3 ml-px" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>
            {onExpand && (
              <button onClick={(e) => { e.stopPropagation(); onExpand(); }} className="w-6 h-6 flex items-center justify-center rounded" style={{ color: "rgba(255,255,255,0.5)" }} title="Fullscreen">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
