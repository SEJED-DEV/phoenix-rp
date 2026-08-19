"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/Skeleton";

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

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-text-muted/30 text-xs focus:outline-none focus:border-purple-400/40 transition-all";
const labelClass = "block text-[10px] text-text-muted uppercase tracking-wider mb-1.5";

const platformOptions = [
  { value: "twitch", label: "Twitch" },
  { value: "youtube", label: "YouTube" },
  { value: "kick", label: "Kick" },
  { value: "tiktok", label: "TikTok" },
];

const SOCIAL_PLATFORMS = [
  { value: "twitter", label: "Twitter / X", icon: "X" },
  { value: "instagram", label: "Instagram", icon: "IG" },
  { value: "youtube", label: "YouTube", icon: "YT" },
  { value: "tiktok", label: "TikTok", icon: "TT" },
  { value: "discord", label: "Discord", icon: "DC" },
  { value: "facebook", label: "Facebook", icon: "FB" },
  { value: "twitch", label: "Twitch", icon: "TW" },
  { value: "other", label: "Other", icon: "..." },
];

function parseUrlInput(value: string): { platform?: "twitch" | "youtube" | "kick" | "tiktok"; username?: string; channelUrl?: string } | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");

    if (host === "kick.com") {
      const username = url.pathname.split("/").filter(Boolean)[0];
      if (username) return { platform: "kick", username, channelUrl: trimmed };
    }
    if (host === "twitch.tv") {
      const username = url.pathname.split("/").filter(Boolean)[0];
      if (username) return { platform: "twitch", username, channelUrl: trimmed };
    }
    if (host === "youtube.com" || host === "youtu.be") {
      if (host === "youtu.be") return null;
      const uParam = url.searchParams.get("u");
      if (uParam) return { platform: "youtube", username: uParam, channelUrl: trimmed };
      const pathUser = url.pathname.split("/").filter(Boolean)[0];
      if (pathUser && pathUser.startsWith("@")) return { platform: "youtube", username: pathUser.slice(1), channelUrl: trimmed };
    }
    if (host === "tiktok.com" || host === "vm.tiktok.com") {
      const username = url.pathname.split("/").filter(Boolean)[0];
      if (username && username.startsWith("@")) return { platform: "tiktok", username: username.slice(1), channelUrl: trimmed };
    }
  } catch {}

  return null;
}

async function fetchKickData(username: string): Promise<{ displayName: string; avatarUrl: string; socialLinks: SocialLink[] } | null> {
  try {
    const res = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(username)}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const socialLinks: SocialLink[] = [];

    const user = data?.user;
    if (user && typeof user === "object") {
      const SOCIAL_KEYS: [string, (v: string) => string][] = [
        ["twitter", (v) => `https://x.com/${v.replace(/^@/, "")}`],
        ["instagram", (v) => `https://instagram.com/${v.replace(/^@/, "")}`],
        ["youtube", (v) => v.startsWith("http") ? v : v.startsWith("@") || v.startsWith("channel/") ? `https://youtube.com/${v}` : `https://youtube.com/@${v}`],
        ["tiktok", (v) => `https://tiktok.com/@${v.replace(/^@/, "")}`],
        ["discord", (v) => v.startsWith("http") ? v : `https://discord.gg/${v}`],
        ["facebook", (v) => `https://facebook.com/${v.replace(/^@/, "")}`],
      ];
      for (const [key, urlFn] of SOCIAL_KEYS) {
        const val = user[key];
        if (typeof val === "string" && val.trim()) {
          socialLinks.push({ platform: key, url: urlFn(val.trim()) });
        }
      }
    }

    const socialsObj = data?.socials;
    if (socialLinks.length === 0 && socialsObj && typeof socialsObj === "object") {
      for (const [p, v] of Object.entries(socialsObj as Record<string, string>)) {
        if (typeof v === "string" && v.trim()) {
          socialLinks.push({ platform: p, url: v.trim() });
        }
      }
    }

    return {
      displayName: data?.user?.username || data?.username || data?.slug || username,
      avatarUrl: data?.user?.profile_pic || data?.profile_pic || "",
      socialLinks,
    };
  } catch {
    return null;
  }
}

export default function StreamersEditor() {
  const [items, setItems] = useState<Streamer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [fetchingIdx, setFetchingIdx] = useState<number | null>(null);
  const fetchTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function fetchItems() {
    try {
      const res = await fetch("/api/staff/streamers");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setItems(data.streamers || []);
    } catch {
      setToast({ type: "error", text: "Failed to load streamers." });
    } finally {
      setLoading(false);
    }
  }

  function addStreamer() {
    setItems((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, platform: "twitch", username: "", displayName: "", avatarUrl: "", channelUrl: "", socialLinks: [] },
    ]);
    setDirty(true);
  }

  function updateItem(index: number, patch: Partial<Streamer>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
    setDirty(true);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  }

  function moveItem(index: number, dir: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return next;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setDirty(true);
  }

  function addSocialLink(index: number) {
    const item = items[index];
    updateItem(index, {
      socialLinks: [...(item.socialLinks || []), { platform: "twitter", url: "" }],
    });
  }

  function updateSocialLink(index: number, socialIdx: number, patch: Partial<SocialLink>) {
    const item = items[index];
    const links = [...(item.socialLinks || [])];
    links[socialIdx] = { ...links[socialIdx], ...patch };
    updateItem(index, { socialLinks: links });
  }

  function removeSocialLink(index: number, socialIdx: number) {
    const item = items[index];
    updateItem(index, {
      socialLinks: (item.socialLinks || []).filter((_, i) => i !== socialIdx),
    });
  }

  const handleUsernameOrUrlChange = useCallback((index: number, value: string) => {
    const parsed = parseUrlInput(value);
    if (parsed) {
      const patch: Partial<Streamer> = { username: parsed.username! };
      if (parsed.platform) patch.platform = parsed.platform;
      if (parsed.channelUrl) patch.channelUrl = parsed.channelUrl;
      updateItem(index, patch);

      if (parsed.platform === "kick" && parsed.username) {
        clearTimeout(fetchTimers.current[index]);
        fetchTimers.current[index] = setTimeout(async () => {
          setFetchingIdx(index);
          const data = await fetchKickData(parsed.username!);
          if (data) {
            updateItem(index, {
              displayName: data.displayName || "",
              avatarUrl: data.avatarUrl || "",
              socialLinks: data.socialLinks.length > 0 ? data.socialLinks : items[index]?.socialLinks || [],
            });
          }
          setFetchingIdx(null);
        }, 600);
      }
    } else {
      updateItem(index, { username: value });
    }
  }, [items]);

  async function handleSave() {
    setSaving(true);
    try {
      const payload = items.map((it) => ({
        id: it.id,
        platform: it.platform,
        username: it.username,
        displayName: it.displayName,
        avatarUrl: it.avatarUrl,
        channelUrl: it.channelUrl,
        socialLinks: it.socialLinks || [],
      }));
      const res = await fetch("/api/staff/streamers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamers: payload }),
      });
      if (!res.ok) throw new Error("Save failed");
      setDirty(false);
      setToast({ type: "success", text: "Streamers saved." });
    } catch {
      setToast({ type: "error", text: "Failed to save streamers." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <Skeleton className="h-3 w-32 mb-3" />
        <Skeleton className="h-6 w-48 mb-8" />
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-3">
        <Link href="/staff-panel" className="text-text-muted hover:text-white transition-colors text-sm">Staff Panel</Link>
        <svg className="w-3 h-3 text-text-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <Link href="/staff-panel/config" className="text-text-muted hover:text-white transition-colors text-sm">Config</Link>
        <svg className="w-3 h-3 text-text-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-white text-sm">Streamers</span>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="w-5 h-px" style={{ background: "linear-gradient(90deg, #a78bfa, transparent)" }} />
        <span className="text-[10px] font-display tracking-[0.25em] uppercase text-purple-400">Streamers Editor</span>
      </div>
      <h1 className="font-display text-2xl tracking-wider text-white mb-1">Streamers Configuration</h1>
      <p className="text-text-muted text-xs mb-8">
        Paste a Kick, Twitch, YouTube, or TikTok URL — username, avatar, display name, and social links auto-fill for Kick channels.
      </p>

      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={addStreamer}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all text-white"
          style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)" }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Streamer
        </button>
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all text-white disabled:opacity-30"
          style={{ background: dirty ? "rgba(167,139,250,0.2)" : "rgba(255,255,255,0.03)", border: `1px solid ${dirty ? "rgba(167,139,250,0.4)" : "rgba(255,255,255,0.06)"}` }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {dirty && (
          <span className="text-[10px] text-amber-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Unsaved changes
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-24 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.06)" }}>
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-2xl" style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.12)" }}>
            <svg className="w-7 h-7 text-purple-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <p className="text-text-dim text-sm font-display tracking-wider mb-1">NO STREAMERS YET</p>
          <p className="text-text-muted text-xs">Click &quot;Add Streamer&quot; to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div
              key={item.id}
              className="rounded-xl overflow-hidden transition-colors"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="flex items-start gap-0">
                <div className="flex flex-col items-center gap-0.5 px-3 py-4" style={{ borderRight: "1px solid rgba(255,255,255,0.04)" }}>
                  <span className="text-[10px] font-display text-text-muted/50">{String(i + 1).padStart(2, "0")}</span>
                  <button onClick={() => moveItem(i, -1)} disabled={i === 0} className="p-1 rounded hover:bg-white/[0.05] transition-colors disabled:opacity-20" title="Move up">
                    <svg className="w-3 h-3 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                    </svg>
                  </button>
                  <button onClick={() => moveItem(i, 1)} disabled={i === items.length - 1} className="p-1 rounded hover:bg-white/[0.05] transition-colors disabled:opacity-20" title="Move down">
                    <svg className="w-3 h-3 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                </div>

                <div className="w-20 h-20 shrink-0 relative m-3 rounded-lg overflow-hidden flex items-center justify-center" style={{ background: "#0d0d0f" }}>
                  {item.avatarUrl ? (
                    <img src={item.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-8 h-8 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  )}
                  <div className="absolute top-1 right-1">
                    <span className="text-[8px] px-1.5 py-0.5 rounded-md font-medium" style={{
                      background: item.platform === "twitch" ? "rgba(145,70,255,0.3)" : item.platform === "kick" ? "rgba(0,255,128,0.3)" : item.platform === "tiktok" ? "rgba(0,0,0,0.5)" : "rgba(255,0,0,0.3)",
                      color: item.platform === "twitch" ? "#c4a6ff" : item.platform === "kick" ? "#6aff9f" : item.platform === "tiktok" ? "#fff" : "#ff6666",
                    }}>
                      {item.platform === "twitch" ? "TWITCH" : item.platform === "kick" ? "KICK" : item.platform === "tiktok" ? "TIKTOK" : "YOUTUBE"}
                    </span>
                  </div>
                  {fetchingIdx === i && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full border-[1.5px] border-white/20 border-t-white animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 py-3 pr-3">
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className={labelClass}>Platform</label>
                      <select
                        value={item.platform}
                        onChange={(e) => updateItem(i, { platform: e.target.value as Streamer["platform"] })}
                        className={inputClass}
                      >
                        {platformOptions.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Username or URL</label>
                      <input
                        type="text"
                        value={item.username}
                        onChange={(e) => handleUsernameOrUrlChange(i, e.target.value)}
                        placeholder="Paste URL or type username"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Display Name</label>
                      <input
                        type="text"
                        value={item.displayName}
                        onChange={(e) => updateItem(i, { displayName: e.target.value })}
                        placeholder="Auto-fills for Kick"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Channel URL</label>
                      <input
                        type="url"
                        value={item.channelUrl}
                        onChange={(e) => updateItem(i, { channelUrl: e.target.value })}
                        placeholder="Auto-fills from pasted URL"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className={labelClass}>Avatar URL</label>
                    <input
                      type="url"
                      value={item.avatarUrl}
                      onChange={(e) => updateItem(i, { avatarUrl: e.target.value })}
                      placeholder="Auto-fills for Kick channels"
                      className={inputClass}
                    />
                  </div>

                  {/* Social Links */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={labelClass}>Social Links</label>
                      <button
                        onClick={() => addSocialLink(i)}
                        className="text-[10px] text-purple-400/70 hover:text-purple-400 transition-colors flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Add
                      </button>
                    </div>
                    {(item.socialLinks || []).length > 0 && (
                      <div className="space-y-1.5">
                        {item.socialLinks.map((link, si) => (
                          <div key={si} className="flex items-center gap-2">
                            <select
                              value={link.platform}
                              onChange={(e) => updateSocialLink(i, si, { platform: e.target.value })}
                              className="w-28 px-2 py-1.5 rounded bg-white/[0.03] border border-white/[0.06] text-white text-[11px] focus:outline-none focus:border-purple-400/40"
                            >
                              {SOCIAL_PLATFORMS.map((sp) => (
                                <option key={sp.value} value={sp.value}>{sp.label}</option>
                              ))}
                            </select>
                            <input
                              type="url"
                              value={link.url}
                              onChange={(e) => updateSocialLink(i, si, { url: e.target.value })}
                              placeholder="https://..."
                              className="flex-1 px-2 py-1.5 rounded bg-white/[0.03] border border-white/[0.06] text-white text-[11px] placeholder:text-text-muted/20 focus:outline-none focus:border-purple-400/40"
                            />
                            <button
                              onClick={() => removeSocialLink(i, si)}
                              className="w-6 h-6 rounded flex items-center justify-center text-red-400/50 hover:text-red-400 hover:bg-red-400/10 transition-all"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pr-3 pt-3">
                  <button
                    onClick={() => removeItem(i)}
                    className="w-8 h-8 rounded-lg bg-red-500/[0.06] border border-red-500/15 text-red-400 hover:bg-red-500/15 flex items-center justify-center transition-all"
                    title="Remove streamer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <p className="text-[10px] text-text-muted/40 mt-4 text-center">
          {items.length} {items.length === 1 ? "streamer" : "streamers"} &middot; Use arrows to reorder
        </p>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className="px-4 py-3 rounded-xl text-xs font-medium shadow-lg"
            style={{
              background: toast.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
              border: `1px solid ${toast.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
              color: toast.type === "success" ? "#34d399" : "#f87171",
            }}
          >
            {toast.text}
          </div>
        </div>
      )}
    </div>
  );
}
