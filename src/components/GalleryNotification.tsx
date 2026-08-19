"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface MediaFile {
  name: string;
  isVideo: boolean;
  src: string;
}

const MESSAGES = [
  "Moments from the streets — check out the gallery",
  "Screenshots and clips are piling up — take a look",
  "The city never sleeps — see what's been captured",
  "New content in the gallery — explore now",
  "Behind every frame, a story — visit the gallery",
  "Fresh captures from the streets of the city",
  "The gallery is growing — don't miss out",
  "Every clip tells a story — see the collection",
];

export default function GalleryNotification() {
  const [item, setItem] = useState<MediaFile | null>(null);
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("gallery_notif_shown")) return;

    const t = setTimeout(() => {
      fetch("/api/media")
        .then((r) => r.json())
        .then((media: MediaFile[]) => {
          if (media.length === 0) return;
          const randomItem = media[Math.floor(Math.random() * media.length)];
          const randomMsg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
          setItem(randomItem);
          setMessage(randomMsg);
          setVisible(true);
          sessionStorage.setItem("gallery_notif_shown", "1");
        })
        .catch(() => {});
    }, 10000);

    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(t);
  }, [visible]);

  if (!item || dismissed) return null;

  return (
    <div
      className="fixed bottom-6 left-6 z-[60] max-w-[340px]"
      style={{
        transform: visible ? "translateX(0) translateY(0)" : "translateX(-120%)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.5s",
      }}
    >
      <Link href="/gallery" className="block group">
        <div
          className="rounded-xl overflow-hidden flex items-stretch"
          style={{
            background: "rgba(10,10,12,0.92)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(196,30,58,0.08)",
          }}
        >
          {/* Thumbnail */}
          <div className="w-[100px] h-[80px] shrink-0 relative overflow-hidden" style={{ background: "#0d0d0f" }}>
            {item.isVideo ? (
              <video src={item.src} muted preload="metadata" className="w-full h-full object-cover" />
            ) : (
              <Image src={item.src} alt="" fill className="object-cover" sizes="100px" />
            )}
            <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 60%, rgba(10,10,12,0.92) 100%)" }} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 px-3.5 py-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-pulse" />
                <span className="text-[9px] font-display tracking-[0.2em] uppercase text-crimson">Gallery</span>
              </div>
              <p className="text-white/80 text-[11px] leading-snug line-clamp-2">{message}</p>
            </div>
            <span className="text-[9px] font-display tracking-[0.15em] uppercase text-white/30 group-hover:text-crimson/70 transition-colors">
              View Gallery
            </span>
          </div>

          {/* Close */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setVisible(false); setTimeout(() => setDismissed(true), 400); }}
            className="absolute top-2 right-2 p-1 rounded-md hover:bg-white/[0.08] text-white/30 hover:text-white/60 transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </Link>
    </div>
  );
}
