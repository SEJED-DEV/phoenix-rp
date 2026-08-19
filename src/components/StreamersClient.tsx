"use client";

import { useEffect, useState, useMemo, useCallback } from "react";

interface SocialLink {
  platform: string;
  url: string;
}

interface Streamer {
  id: string;
  platform: "twitch" | "youtube" | "kick" | "tiktok";
  username: string;
  displayName: string;
  avatarUrl: string;
  channelUrl: string;
  socialLinks: SocialLink[];
}

interface LiveStatus {
  isLive: boolean;
  title?: string;
  viewers?: number;
  category?: string;
}

type Filter = "all" | "twitch" | "youtube" | "kick" | "tiktok";

const platformColor: Record<string, string> = {
  twitch: "#a78bfa",
  youtube: "#ff4444",
  kick: "#53fc18",
  tiktok: "#f0f0f0",
};

const socialMeta: Record<string, { color: string; label: string }> = {
  twitter: { color: "#1da1f2", label: "Twitter" },
  instagram: { color: "#e4405f", label: "Instagram" },
  youtube: { color: "#ff4444", label: "YouTube" },
  tiktok: { color: "#f0f0f0", label: "TikTok" },
  discord: { color: "#5865f2", label: "Discord" },
  facebook: { color: "#1877f2", label: "Facebook" },
  twitch: { color: "#a78bfa", label: "Twitch" },
};

function PlatformIcon({ platform, className = "w-4 h-4" }: { platform: string; className?: string }) {
  if (platform === "twitch") {
    return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" /></svg>;
  }
  if (platform === "youtube") {
    return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>;
  }
  if (platform === "kick") {
    return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M4.265 8.194c-.063.014-.126.03-.19.046-.646.156-1.09.744-1.09 1.425v4.662c0 .28.227.507.507.507h2.787a.507.507 0 00.507-.507V10.14c0-.063-.012-.126-.03-.19-.14-.576-.567-.992-1.114-1.056a6.12 6.12 0 00-1.377 0v-.7zm7.552-3.13c-.163-.037-.33-.056-.498-.056H8.134c-.28 0-.507.227-.507.507v9.324c0 .28.227.507.507.507h5.23a.507.507 0 00.507-.507v-3.13c.418-.142.802-.36 1.138-.643.637-.533 1.065-1.327 1.065-2.224 0-.897-.428-1.69-1.065-2.224-.336-.282-.72-.501-1.138-.642V5.064zm-1.515.855h2.184c.418.142.802.36 1.138.643.637.534 1.065 1.327 1.065 2.224 0 .897-.428 1.69-1.065 2.224-.336.282-.72.501-1.138.643v2.681h-2.184V5.92zM1.2 9.665c-.547 0-1.065.17-1.2.507v10.06c0 .28.227.507.507.507h2.787a.507.507 0 00.507-.507V10.14c0-.063-.013-.126-.03-.19-.14-.576-.567-.992-1.114-1.056a6.12 6.12 0 00-1.457.271zm13.268-4.472c-.336-.282-.72-.501-1.138-.643h-2.184v3.538c.418.142.802.36 1.138.643.637.534 1.065 1.327 1.065 2.224 0 .897-.428 1.69-1.065 2.224-.336.282-.72.501-1.138.643v1.737h2.184c.418-.142.802-.36 1.138-.643.637-.533 1.065-1.327 1.065-2.224 0-.897-.428-1.69-1.065-2.224-.336-.282-.72-.501-1.138-.643V5.193z" /></svg>;
  }
  if (platform === "tiktok") {
    return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46v-7.13a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-.19-1.16v.68z" /></svg>;
  }
  return null;
}

function SocialIcon({ platform, className = "w-3 h-3" }: { platform: string; className?: string }) {
  if (platform === "twitter") return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>;
  if (platform === "instagram") return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>;
  if (platform === "youtube") return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>;
  if (platform === "tiktok") return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46v-7.13a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-.19-1.16v.68z" /></svg>;
  if (platform === "discord") return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>;
  if (platform === "facebook") return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>;
  if (platform === "twitch") return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" /></svg>;
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>;
}

async function fetchKickLive(username: string): Promise<LiveStatus> {
  try {
    const res = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(username)}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { isLive: false };
    const data = await res.json();
    const ls = data?.livestream;
    if (!ls || !ls.is_live) return { isLive: false };
    return { isLive: true, title: ls.session_title || "", viewers: ls.viewer_count || 0, category: ls.categories?.[0]?.name || "" };
  } catch {
    return { isLive: false };
  }
}

async function fetchTwitchLive(username: string): Promise<LiveStatus> {
  try {
    const res = await fetch(`https://decapi.me/twitch/uptime/${encodeURIComponent(username)}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return { isLive: false };
    const text = await res.text();
    if (text.includes("is not live") || text.includes("not currently")) return { isLive: false };
    return { isLive: true };
  } catch {
    return { isLive: false };
  }
}

async function fetchYouTubeLive(username: string): Promise<LiveStatus> {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/@${encodeURIComponent(username)}`)}&format=json`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return { isLive: false };
    return { isLive: true };
  } catch {
    return { isLive: false };
  }
}

export default function StreamersClient() {
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [liveStatuses, setLiveStatuses] = useState<Record<string, LiveStatus>>({});
  const [filter, setFilter] = useState<Filter>("all");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  const checkAllLive = useCallback(async (all: Streamer[]) => {
    const results: Record<string, LiveStatus> = {};
    const kickUsers = all.filter((s) => s.platform === "kick").map((s) => s.username);
    const twitchUsers = all.filter((s) => s.platform === "twitch").map((s) => s.username);
    const youtubeUsers = all.filter((s) => s.platform === "youtube").map((s) => s.username);
    const [k, t, y] = await Promise.all([
      Promise.all(kickUsers.map(async (u) => ({ u, s: await fetchKickLive(u) }))),
      Promise.all(twitchUsers.map(async (u) => ({ u, s: await fetchTwitchLive(u) }))),
      Promise.all(youtubeUsers.map(async (u) => ({ u, s: await fetchYouTubeLive(u) }))),
    ]);
    for (const r of [...k, ...t, ...y]) results[r.u] = r.s;
    setLiveStatuses(results);
  }, []);

  useEffect(() => {
    fetch("/api/streamers")
      .then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then((data: Streamer[]) => { setStreamers(data); setReady(true); checkAllLive(data); })
      .catch(() => { setError(true); setReady(true); });
  }, [checkAllLive]);

  const filtered = useMemo(() => filter === "all" ? streamers : streamers.filter((s) => s.platform === filter), [streamers, filter]);
  const liveCount = useMemo(() => Object.values(liveStatuses).filter((s) => s.isLive).length, [liveStatuses]);
  const liveStreamers = useMemo(() => filtered.filter((s) => liveStatuses[s.username]?.isLive), [filtered, liveStatuses]);
  const offlineStreamers = useMemo(() => filtered.filter((s) => !liveStatuses[s.username]?.isLive), [filtered, liveStatuses]);

  if (!ready) {
    return (
      <section className="relative min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-6 h-6 rounded-full border-[2px] border-white/10 border-t-white/60 animate-spin" />
          <span className="text-[10px] tracking-[0.4em] uppercase text-white/20 font-display">Loading</span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="relative min-h-screen bg-bg flex flex-col items-center justify-center gap-6 px-6">
        <p className="font-display text-lg tracking-[0.2em] text-white/30">COULDN&apos;T LOAD STREAMERS</p>
        <button onClick={() => window.location.reload()} className="px-5 py-2.5 rounded-lg text-xs text-white/50 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all">Refresh</button>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen bg-bg overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[1000px] h-[700px] rounded-full blur-[250px] opacity-[0.04]" style={{ background: "#a78bfa" }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[200px] opacity-[0.03]" style={{ background: "#53fc18" }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-36 sm:pt-44 pb-20">
        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 max-w-[60px]" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12))" }} />
            <span className="text-[9px] tracking-[0.5em] uppercase text-white/20 font-display">Roster</span>
            <div className="h-px flex-1 max-w-[60px]" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.12), transparent)" }} />
          </div>
          <h1 className="font-display text-5xl sm:text-7xl md:text-8xl tracking-tight text-white mb-4">
            Streamers
          </h1>
          <p className="text-white/25 text-sm max-w-md leading-relaxed">
            {streamers.length > 0 && (
              <>
                {liveCount > 0 ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                    </span>
                    <span className="text-red-400/80">{liveCount} live now</span>
                    <span className="text-white/15 mx-1">·</span>
                  </span>
                ) : (
                  <span className="text-white/15">All offline right now</span>
                )}
                {streamers.length} {streamers.length === 1 ? "member" : "members"}
              </>
            )}
          </p>
        </div>

        {/* Platform filters */}
        <div className="flex items-center gap-1 mb-12 overflow-x-auto pb-2">
          {(["all", "twitch", "youtube", "kick", "tiktok"] as Filter[]).map((f) => {
            const count = f === "all" ? streamers.length : streamers.filter((s) => s.platform === f).length;
            if (f !== "all" && count === 0) return null;
            const isActive = filter === f;
            const color = f !== "all" ? platformColor[f] : "#fff";
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="relative px-4 py-2 rounded-lg text-[11px] font-medium tracking-wide transition-all duration-200 whitespace-nowrap"
                style={{
                  background: isActive ? `${color}10` : "transparent",
                  border: `1px solid ${isActive ? `${color}25` : "transparent"}`,
                  color: isActive ? color : "rgba(255,255,255,0.25)",
                }}
              >
                <span className="flex items-center gap-2">
                  {f !== "all" && <PlatformIcon platform={f} className="w-3 h-3" />}
                  {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                  <span className="text-[9px] opacity-40">{count}</span>
                </span>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-32">
            <p className="text-white/15 text-xs tracking-[0.3em] uppercase font-display">No streamers{filter !== "all" ? ` on ${filter}` : ""}</p>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Live section */}
            {liveStreamers.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  <span className="text-[10px] tracking-[0.4em] uppercase text-white/25 font-display">Live Now</span>
                  <div className="h-px flex-1 bg-white/[0.04]" />
                </div>
                <div className="space-y-2">
                  {liveStreamers.map((s, i) => (
                    <StreamerRow key={s.id} streamer={s} live={liveStatuses[s.username]} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Offline section */}
            {offlineStreamers.length > 0 && (
              <div>
                {liveStreamers.length > 0 && (
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-2 h-2 rounded-full bg-white/10" />
                    <span className="text-[10px] tracking-[0.4em] uppercase text-white/15 font-display">Offline</span>
                    <div className="h-px flex-1 bg-white/[0.03]" />
                  </div>
                )}
                <div className="space-y-1">
                  {offlineStreamers.map((s, i) => (
                    <StreamerRow key={s.id} streamer={s} live={liveStatuses[s.username]} index={i + liveStreamers.length} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function StreamerRow({ streamer, live, index }: { streamer: Streamer; live?: LiveStatus; index: number }) {
  const color = platformColor[streamer.platform] || "#999";
  const isLive = live?.isLive;
  const url = streamer.channelUrl || (
    streamer.platform === "twitch" ? `https://twitch.tv/${streamer.username}` :
    streamer.platform === "kick" ? `https://kick.com/${streamer.username}` :
    streamer.platform === "tiktok" ? `https://tiktok.com/@${streamer.username}` :
    `https://youtube.com/@${streamer.username}`
  );
  const label = streamer.displayName || streamer.username;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 px-4 py-3.5 rounded-xl bg-white/[0.02] transition-all duration-300 hover:bg-white/[0.04] hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.015)] relative"
      style={{
        animation: `fadeIn 0.4s ease ${index * 0.05}s both`,
      }}
    >
      {/* Live glow */}
      {isLive && (
        <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ background: `linear-gradient(90deg, ${color}06, transparent 40%)` }} />
      )}

      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center"
          style={{
            background: streamer.avatarUrl ? "transparent" : `${color}12`,
            border: `2px solid ${isLive ? color : `${color}20`}`,
            boxShadow: isLive ? `0 0 20px ${color}15` : "none",
          }}
        >
          {streamer.avatarUrl ? (
            <img src={streamer.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span style={{ color: color }}><PlatformIcon platform={streamer.platform} className="w-5 h-5" /></span>
          )}
        </div>
        {isLive && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-bg flex items-center justify-center" style={{ border: `2px solid ${color}` }}>
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" style={{ boxShadow: "0 0 6px rgba(239,68,68,0.8)" }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="font-display text-sm tracking-wide text-white/90 truncate group-hover:text-white transition-colors">{label}</span>
          {isLive && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase text-red-400/90 bg-red-500/10 border border-red-500/20">
              Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span style={{ color }} className="opacity-50"><PlatformIcon platform={streamer.platform} className="w-2.5 h-2.5" /></span>
          <span className="text-[11px] text-white/20">{streamer.username}</span>
          {isLive && live?.title && (
            <>
              <span className="text-white/8 mx-1.5">·</span>
              <span className="text-[11px] text-white/25 truncate">{live.title}</span>
            </>
          )}
        </div>
      </div>

      {/* Viewers */}
      {isLive && live?.viewers != null && live.viewers > 0 && (
        <div className="shrink-0 text-right mr-2">
          <span className="text-xs font-display text-white/30">{live.viewers >= 1000 ? `${(live.viewers / 1000).toFixed(1)}k` : live.viewers}</span>
          <span className="text-[9px] text-white/12 ml-1">watching</span>
        </div>
      )}

      {/* Social links */}
      {streamer.socialLinks && streamer.socialLinks.length > 0 && (
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          {streamer.socialLinks.map((link, li) => {
            const sm = socialMeta[link.platform] || { color: "#666", label: link.platform };
            return (
              <a
                key={li}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center w-6 h-6 rounded-md transition-all hover:scale-110"
                style={{ color: sm.color, background: `${sm.color}08` }}
                title={sm.label}
              >
                <SocialIcon platform={link.platform} className="w-3 h-3" />
              </a>
            );
          })}
        </div>
      )}

      {/* External link icon */}
      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <svg className="w-3.5 h-3.5 text-white/15 group-hover:text-white/30 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </a>
  );
}
