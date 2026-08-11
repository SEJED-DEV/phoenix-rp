"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";

interface Lock {
  locked: boolean;
  reason: "active" | "cooldown" | null;
  lockedUntilIso: string | null;
  remainingMs: number;
  jobId: number | null;
}

interface Job {
  id: number;
  message: string;
  status: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  totalMembers: number;
  delayMs: number;
  lastError: string | null;
  createdAtIso: string | null;
  startedAtIso: string | null;
  completedAtIso: string | null;
}

interface Stats {
  total: number;
  pending: number;
  sent: number;
  failed: number;
  blocked: number;
  skipped: number;
}

interface Recipient {
  id: number;
  userId: string;
  username: string;
  status: string;
  attempts: number;
  error: string | null;
  updatedAt: string | null;
}

interface Summary {
  delayMs: number;
  maxMessageLength: number;
  memberCount: number | null;
  lock: Lock;
  activeJob: { job: Job; stats: Stats; pendingRemaining: number; etaSeconds: number } | null;
  recipients: Recipient[] | null;
  recentJobs: { job: Job; stats: Stats }[];
}

const STATUS_META: Record<string, { label: string; color: string; soft: string }> = {
  sent: { label: "Sent", color: "#34d399", soft: "rgba(52,211,153,0.1)" },
  blocked: { label: "Blocked", color: "#fbbf24", soft: "rgba(251,191,36,0.1)" },
  failed: { label: "Failed", color: "#f87171", soft: "rgba(248,113,113,0.1)" },
  pending: { label: "Pending", color: "#94a3b8", soft: "rgba(148,163,184,0.1)" },
  skipped: { label: "Skipped", color: "#64748b", soft: "rgba(100,116,139,0.1)" },
};

const JOB_STATUS_META: Record<string, { label: string; color: string }> = {
  queued: { label: "Queued", color: "#60a5fa" },
  running: { label: "Running", color: "#fbbf24" },
  completed: { label: "Completed", color: "#34d399" },
  cancelled: { label: "Cancelled", color: "#f87171" },
  failed: { label: "Failed", color: "#ef4444" },
};

function formatDuration(ms: number): string {
  if (ms <= 0) return "0s";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function formatClock(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function BroadcastPanel() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  const [message, setMessage] = useState("");
  const [stage, setStage] = useState<"compose" | "confirm">("compose");
  const [submitting, setSubmitting] = useState(false);

  const [recStatus, setRecStatus] = useState("all");
  const [recRows, setRecRows] = useState<Recipient[]>([]);
  const [recTotal, setRecTotal] = useState(0);
  const [recLoading, setRecLoading] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/staff/broadcast");
      if (!r.ok) throw new Error("Failed to load");
      const d = (await r.json()) as Summary;
      setData(d);
      setError("");
    } catch {
      setError("Failed to load broadcast status.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRecipients = useCallback(async (jobId: number, status: string) => {
    setRecLoading(true);
    try {
      const r = await fetch(`/api/staff/broadcast/${jobId}?status=${status}&limit=100`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      setRecRows(d.recipients || []);
      setRecTotal(d.stats?.total ?? 0);
    } catch {
      setRecRows([]);
    } finally {
      setRecLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 4000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      clearInterval(tick);
    };
  }, [load]);

  const activeJob = data?.activeJob?.job ?? null;
  const activeStats = data?.activeJob?.stats ?? null;

  useEffect(() => {
    if (activeJob && activeJob.status !== "completed" && activeJob.status !== "cancelled" && activeJob.status !== "failed") {
      loadRecipients(activeJob.id, recStatus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeJob?.id, recStatus]);

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const r = await fetch("/api/staff/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(j.error || "Failed to start broadcast.");
        if (r.status === 409) setStage("compose");
        return;
      }
      setMessage("");
      setStage("compose");
      await load();
    } catch {
      setError("Failed to start broadcast.");
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async (jobId: number) => {
    const ok = window.confirm(
      "Cancel this broadcast? Members who already received the DM keep it — remaining members will be skipped. The 24-hour lock stays."
    );
    if (!ok) return;
    try {
      await fetch(`/api/staff/broadcast/${jobId}/cancel`, { method: "POST" });
      await load();
    } catch {
      setError("Failed to cancel broadcast.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <Skeleton className="h-3 w-40 mb-3" />
        <Skeleton className="h-6 w-52 mb-8" />
        <div className="grid lg:grid-cols-2 gap-6">
          <SkeletonCard className="p-6"><Skeleton className="h-40 w-full" /></SkeletonCard>
          <SkeletonCard className="p-6"><Skeleton className="h-40 w-full" /></SkeletonCard>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-40">
        <p className="text-text-muted text-sm">Failed to load broadcast status.</p>
      </div>
    );
  }

  const lock = data.lock;
  const locked = lock.locked;
  const isActive = locked && lock.reason === "active";
  const memberCount = data.memberCount;
  const estimatedMin = memberCount
    ? Math.ceil((memberCount * data.delayMs) / 1000 / 60)
    : null;
  const remaining = lock.remainingMs;
  const lockedUntilMs = lock.lockedUntilIso ? new Date(lock.lockedUntilIso).getTime() : null;
  const liveRemaining = lockedUntilMs ? lockedUntilMs - now : remaining;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/staff-panel" className="text-text-muted hover:text-white transition-colors text-sm">
            Staff Panel
          </Link>
          <svg className="w-3 h-3 text-text-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-white text-sm">Mass DM</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-5 h-px" style={{ background: "linear-gradient(90deg, color-mix(in srgb, var(--color-crimson) 80%, transparent), transparent)" }} />
          <span className="text-[10px] font-display tracking-[0.25em] uppercase text-crimson">Owner only</span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl tracking-wider text-white">Mass DM</h1>
            <p className="text-text-muted text-xs mt-1.5">
              Send a direct message to every member of the Discord server — one at a time, strictly rate limited.
            </p>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full border border-crimson/40 bg-crimson/10 text-crimson">
            1 DM every {(data.delayMs / 1000).toFixed(1)}s · 24h lock
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 px-3 py-2.5 rounded-lg text-xs text-[#f87171] border border-[#f87171]/25 bg-[#f87171]/10">
          {error}
        </div>
      )}

      {locked ? (
        /* ── Locked / active state ─────────────────────────── */
        <div className="space-y-6">
          {/* Lock banner */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: "linear-gradient(160deg, color-mix(in srgb, var(--color-crimson) 7%, transparent) 0%, rgba(255,255,255,0.01) 100%)",
              border: "1px solid color-mix(in srgb, var(--color-crimson) 30%, transparent)",
            }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex items-center gap-3 shrink-0">
                <span className="w-10 h-10 rounded-xl flex items-center justify-center text-crimson" style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.25)" }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </span>
                <div>
                  <p className="font-display text-sm tracking-[0.15em] uppercase text-white">
                    {isActive ? "Mass DM in progress" : "Mass DM locked"}
                  </p>
                  <p className="text-text-muted text-xs mt-0.5">
                    {isActive
                      ? "Sending DMs to members right now. No new broadcasts allowed."
                      : "A 24-hour lockdown is active after the last broadcast. No new broadcasts allowed."}
                  </p>
                </div>
              </div>
              <div className="flex-1" />
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Unlocks in</p>
                <p className="font-display text-2xl tracking-wider text-white tabular-nums">{formatDuration(Math.max(0, liveRemaining))}</p>
                {lock.lockedUntilIso && (
                  <p className="text-[10px] text-text-muted/60 mt-0.5">{formatClock(lock.lockedUntilIso)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Active progress */}
          {isActive && activeJob && activeStats && (
            <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-sm tracking-[0.15em] uppercase text-white">Broadcast #{activeJob.id}</h2>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{
                      background: `${JOB_STATUS_META[activeJob.status]?.color ?? "#94a3b8"}1a`,
                      color: JOB_STATUS_META[activeJob.status]?.color ?? "#94a3b8",
                      border: `1px solid ${JOB_STATUS_META[activeJob.status]?.color ?? "#94a3b8"}33`,
                    }}
                  >
                    {JOB_STATUS_META[activeJob.status]?.label ?? activeJob.status}
                  </span>
                  {activeJob.status !== "completed" && activeJob.status !== "cancelled" && activeJob.status !== "failed" && (
                    <button
                      onClick={() => cancel(activeJob.id)}
                      className="text-[10px] px-2 py-0.5 rounded-full border border-[#f87171]/40 text-[#f87171] hover:bg-[#f87171]/10 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-text-muted">ETA</p>
                  <p className="text-sm font-semibold text-white tabular-nums">
                    {activeJob.status === "running" ? formatDuration(data.activeJob!.etaSeconds * 1000) : "—"}
                  </p>
                </div>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Message preview */}
                <div className="rounded-xl px-4 py-3 text-xs text-text-dim whitespace-pre-wrap" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  {activeJob.message}
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-[11px] text-text-muted mb-2">
                    <span>
                      <span className="text-white font-semibold">{activeStats.sent}</span> / {activeStats.total > 0 ? activeStats.total : (data.activeJob!.pendingRemaining + activeStats.sent)} sent
                    </span>
                    <span>
                      {activeStats.total > 0
                        ? Math.round((activeStats.sent / activeStats.total) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${activeStats.total > 0 ? Math.min((activeStats.sent / activeStats.total) * 100, 100) : 0}%`,
                        background: "linear-gradient(90deg, color-mix(in srgb, var(--color-crimson) 70%, transparent), color-mix(in srgb, var(--color-gold) 60%, transparent))",
                      }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Sent", value: activeStats.sent, color: "#34d399" },
                    { label: "Failed", value: activeStats.failed, color: "#f87171" },
                    { label: "Blocked", value: activeStats.blocked, color: "#fbbf24" },
                    { label: "Pending", value: activeStats.pending, color: "#94a3b8" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <p className="text-[9px] uppercase tracking-wider text-text-muted">{s.label}</p>
                      <p className="text-2xl font-display tabular-nums" style={{ color: s.color }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {activeJob.lastError && (
                  <p className="text-[11px] text-[#f87171] px-3 py-2 rounded-lg border border-[#f87171]/25 bg-[#f87171]/10">
                    {activeJob.lastError}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Recipient log */}
          {isActive && activeJob && (
            <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <h2 className="font-display text-sm tracking-[0.15em] uppercase text-white">Delivery log</h2>
              </div>
              <div className="px-6 py-4 flex flex-wrap gap-2">
                {(["all", "sent", "failed", "blocked", "pending", "skipped"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setRecStatus(s)}
                    className={`px-3 py-1 rounded-lg text-[11px] transition-colors ${recStatus === s ? "bg-white/[0.08] text-white border border-white/[0.12]" : "bg-white/[0.02] text-text-muted border border-white/[0.05] hover:text-white"}`}
                  >
                    {s === "all" ? "All" : STATUS_META[s]?.label ?? s}
                  </button>
                ))}
              </div>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                {recLoading ? (
                  <div className="px-6 py-8 flex justify-center">
                    <span className="w-5 h-5 border border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--color-gold)" }} />
                  </div>
                ) : recRows.length === 0 ? (
                  <p className="px-6 py-8 text-center text-text-muted text-sm">No deliveries to show yet.</p>
                ) : (
                  <div className="divide-y divide-white/[0.04] max-h-96 overflow-y-auto">
                    {recRows.map((r) => {
                      const meta = STATUS_META[r.status] ?? STATUS_META.pending;
                      return (
                        <div key={r.id} className="flex items-center gap-3 px-6 py-2.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color }} />
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm text-text-dim truncate">
                              <span className="text-white">@{r.username}</span>
                              <span className="text-text-muted/40"> · {r.userId}</span>
                            </span>
                            {r.error && <span className="block text-[11px] text-[#f87171] truncate">{r.error}</span>}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0" style={{ background: meta.soft, color: meta.color }}>
                            {meta.label}
                          </span>
                          <span className="text-[10px] text-text-muted/50 shrink-0 tabular-nums">{formatClock(r.updatedAt)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent broadcasts history */}
          {data.recentJobs.length > 0 && !isActive && (
            <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <h2 className="font-display text-sm tracking-[0.15em] uppercase text-white">Broadcast history</h2>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {data.recentJobs.map(({ job, stats }) => {
                  const meta = JOB_STATUS_META[job.status] ?? { label: job.status, color: "#94a3b8" };
                  return (
                    <div key={job.id} className="px-6 py-4">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white font-medium">Broadcast #{job.id}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${meta.color}1a`, color: meta.color, border: `1px solid ${meta.color}33` }}>
                            {meta.label}
                          </span>
                        </div>
                        <span className="text-[10px] text-text-muted/60 tabular-nums">{formatClock(job.createdAtIso)}</span>
                      </div>
                      <p className="text-xs text-text-muted truncate mb-2">{job.message}</p>
                      <div className="flex gap-4 text-[11px] text-text-muted">
                        <span><span className="text-emerald-400">{stats.sent}</span> sent</span>
                        <span><span className="text-red-400">{stats.failed}</span> failed</span>
                        <span><span className="text-amber-400">{stats.blocked}</span> blocked</span>
                        {job.lastError && <span className="text-red-400 truncate">{job.lastError}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Composer ─────────────────────────────────────── */
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <h2 className="font-display text-sm tracking-[0.15em] uppercase text-white">New broadcast</h2>
              </div>
              <div className="px-6 py-5">
                {stage === "compose" ? (
                  <>
                    <label className="block text-[10px] uppercase tracking-widest text-text-muted mb-2">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={6}
                      maxLength={data.maxMessageLength}
                      placeholder="Write the DM every member will receive…"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-text-muted/30 text-sm focus:outline-none focus:border-gold/40 transition-colors resize-y"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-[10px] text-text-muted/60">
                        Discord limit: {data.maxMessageLength} characters
                      </p>
                      <span className={`text-[10px] tabular-nums ${message.length > data.maxMessageLength - 200 ? "text-red-400" : "text-text-muted/60"}`}>
                        {message.length}/{data.maxMessageLength}
                      </span>
                    </div>

                    {message.trim().length > 0 && (
                      <div className="mt-4 rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Preview</p>
                        <p className="text-sm text-text-dim whitespace-pre-wrap">{message}</p>
                      </div>
                    )}

                    <div className="mt-5 flex justify-end">
                      <button
                        onClick={() => setStage("confirm")}
                        disabled={!message.trim()}
                        className="px-5 py-2.5 rounded-lg text-xs font-semibold tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white"
                        style={{
                          background: "linear-gradient(135deg, color-mix(in srgb, var(--color-crimson) 90%, black) 0%, color-mix(in srgb, var(--color-crimson) 60%, black) 100%)",
                          border: "1px solid color-mix(in srgb, var(--color-crimson) 50%, transparent)",
                        }}
                      >
                        Continue
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Confirm broadcast</p>
                    <div className="rounded-xl px-4 py-3 mb-4 text-sm text-text-dim whitespace-pre-wrap" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      {message}
                    </div>

                    <div className="rounded-xl px-4 py-3 mb-4 border border-[#f87171]/25 bg-[#f87171]/8">
                      <p className="text-xs text-[#f87171] leading-relaxed">
                        This sends a DM to <span className="font-semibold">{memberCount != null ? memberCount.toLocaleString() : "every"}</span> member of the Discord server.
                        It cannot be undone, and after this broadcast <span className="font-semibold">no new broadcast is allowed for 24 hours</span> — even if you cancel it.
                      </p>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setStage("compose")}
                        disabled={submitting}
                        className="px-4 py-2.5 rounded-lg text-xs text-text-muted bg-white/[0.03] border border-white/[0.06] hover:text-white transition-colors disabled:opacity-40"
                      >
                        Back
                      </button>
                      <button
                        onClick={submit}
                        disabled={submitting}
                        className="px-5 py-2.5 rounded-lg text-xs font-semibold tracking-widest transition-all disabled:opacity-50 text-white"
                        style={{
                          background: "linear-gradient(135deg, color-mix(in srgb, var(--color-crimson) 90%, black) 0%, color-mix(in srgb, var(--color-crimson) 60%, black) 100%)",
                          border: "1px solid color-mix(in srgb, var(--color-crimson) 50%, transparent)",
                        }}
                      >
                        {submitting ? "Sending…" : "Send Broadcast"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {data.recentJobs.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <h2 className="font-display text-sm tracking-[0.15em] uppercase text-white">Broadcast history</h2>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {data.recentJobs.map(({ job, stats }) => {
                    const meta = JOB_STATUS_META[job.status] ?? { label: job.status, color: "#94a3b8" };
                    return (
                      <div key={job.id} className="px-6 py-4">
                        <div className="flex items-center justify-between gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white font-medium">Broadcast #{job.id}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${meta.color}1a`, color: meta.color, border: `1px solid ${meta.color}33` }}>
                              {meta.label}
                            </span>
                          </div>
                          <span className="text-[10px] text-text-muted/60 tabular-nums">{formatClock(job.createdAtIso)}</span>
                        </div>
                        <p className="text-xs text-text-muted truncate mb-2">{job.message}</p>
                        <div className="flex gap-4 text-[11px] text-text-muted">
                          <span><span className="text-emerald-400">{stats.sent}</span> sent</span>
                          <span><span className="text-red-400">{stats.failed}</span> failed</span>
                          <span><span className="text-amber-400">{stats.blocked}</span> blocked</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Info column */}
          <div className="space-y-4">
            <div className="rounded-2xl p-5" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <h3 className="font-display text-xs tracking-[0.15em] uppercase text-white mb-3">Before you start</h3>
              <ul className="space-y-3 text-xs text-text-muted">
                <li className="flex gap-2.5">
                  <span className="text-gold shrink-0">→</span>
                  <span>DMs are sent <span className="text-white">one at a time</span> with strict rate limiting to avoid hitting Discord limits.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="text-gold shrink-0">→</span>
                  <span>Members who block the bot or have DMs closed are marked <span className="text-amber-400">blocked</span> and skipped.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="text-crimson shrink-0">→</span>
                  <span>Once started, <span className="text-crimson">no new broadcast is allowed for 24 hours</span>, even if cancelled.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl p-5" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <h3 className="font-display text-xs tracking-[0.15em] uppercase text-white mb-3">Estimated time</h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted">Guild members</span>
                  <span className="text-white tabular-nums">{memberCount != null ? memberCount.toLocaleString() : "Unknown"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Pacing</span>
                  <span className="text-white tabular-nums">1 / {(data.delayMs / 1000).toFixed(1)}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Estimated duration</span>
                  <span className="text-white font-semibold tabular-nums">
                    {estimatedMin != null ? `~${estimatedMin} min` : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
