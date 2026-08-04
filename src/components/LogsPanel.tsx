"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getActionMeta, ACTION_META } from "@/lib/staff-actions";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";

interface LogRow {
  id: number;
  actorId: string;
  actorName: string;
  action: string;
  targetId: string | null;
  targetName: string | null;
  reason: string | null;
  metadata: string | null;
  createdAt: string;
}

interface Stats {
  total: number;
  thisWeek: number;
  byAction: Record<string, number>;
}

interface LogsData {
  logs: LogRow[];
  total: number;
  page: number;
  limit: number;
  stats: Stats;
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr + "Z");
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

function formatFullTime(dateStr: string): string {
  const d = new Date(dateStr + "Z");
  return d.toLocaleString();
}

function StatPill({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className="p-4 rounded-xl" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <p className="text-text-muted text-[10px] tracking-widest uppercase mb-1.5">{label}</p>
      <p className="text-2xl font-display tracking-wider" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}

export default function LogsPanel() {
  const [data, setData] = useState<LogsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");
  const [q, setQ] = useState("");
  const [qInput, setQInput] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (action) params.set("action", action);
    if (q) params.set("q", q);
    params.set("page", String(page));
    try {
      const res = await fetch(`/api/staff/logs?${params}`);
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false);
  }, [action, q, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const toggleExpanded = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const actionKeys = Object.keys(ACTION_META);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/staff-panel" className="text-text-muted hover:text-white transition-colors text-sm">
            Staff Panel
          </Link>
          <svg className="w-3 h-3 text-text-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-white text-sm">Logs</span>
        </div>
        <h1 className="font-display text-2xl tracking-wider text-white">Activity Logs</h1>
        <p className="text-text-muted text-xs mt-1.5">Every staff action recorded, with full metadata.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatPill label="Total Events" value={data?.stats.total ?? "—"} accent="#f59e0b" />
        <StatPill label="This Week" value={data?.stats.thisWeek ?? "—"} accent="#34d399" />
        <StatPill label="Actions" value={data ? Object.keys(data.stats.byAction).length : "—"} accent="#60a5fa" />
        <StatPill label="Page Size" value={data?.limit ?? "—"} accent="#94a3b8" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setQ(qInput.trim());
                setPage(1);
              }
            }}
            placeholder="Search actor, target, reason, metadata... (Enter)"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-text-muted/30 text-sm focus:outline-none focus:border-crimson/40 transition-all"
          />
        </div>
        <select
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
          className="sm:w-72 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-crimson/40 transition-all"
        >
          <option value="">All actions</option>
          {actionKeys.map((key) => (
            <option key={key} value={key}>
              {getActionMeta(key).label}
              {data?.stats.byAction[key] ? ` (${data.stats.byAction[key]})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="w-16 h-5 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
            </SkeletonCard>
          ))}
        </div>
      ) : !data || data.logs.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-text-muted text-sm">No logs match your filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.logs.map((log) => {
            const meta = getActionMeta(log.action);
            const isOpen = expanded.has(log.id);
            let parsedMeta: unknown = null;
            if (log.metadata) {
              try {
                parsedMeta = JSON.parse(log.metadata);
              } catch {}
            }
            return (
              <div
                key={log.id}
                className="rounded-xl overflow-hidden transition-colors"
                style={{
                  background: "linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <button
                  onClick={() => toggleExpanded(log.id)}
                  className="w-full flex items-center gap-4 px-5 py-3 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span
                    className="shrink-0 text-[10px] px-2 py-1 rounded-full border font-medium"
                    style={{ color: meta.color, borderColor: `${meta.color}30`, backgroundColor: `${meta.color}0d` }}
                  >
                    {meta.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-dim truncate">
                      <span className="text-white">{log.actorName}</span>
                      {log.targetName && (
                        <>
                          {" → "}
                          <span className="text-crimson">{log.targetName}</span>
                        </>
                      )}
                    </p>
                    {log.reason && <p className="text-[11px] text-text-muted truncate mt-0.5">{log.reason}</p>}
                  </div>
                  <span className="text-[10px] text-text-muted/50 shrink-0" title={formatFullTime(log.createdAt)}>
                    {formatTimeAgo(log.createdAt)}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 text-text-muted/40 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="px-5 pb-4" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    {meta.description && (
                      <p className="text-[11px] text-text-muted mt-3 mb-2">{meta.description}</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-[11px] text-text-muted mb-3">
                      <div className="flex justify-between gap-4">
                        <span className="uppercase tracking-wider opacity-60">Log ID</span>
                        <span className="text-white/80">#{log.id}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="uppercase tracking-wider opacity-60">Action</span>
                        <span className="text-white/80">{log.action}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="uppercase tracking-wider opacity-60">Actor ID</span>
                        <span className="text-white/80">{log.actorId}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="uppercase tracking-wider opacity-60">Timestamp</span>
                        <span className="text-white/80">{formatFullTime(log.createdAt)}</span>
                      </div>
                      {log.targetId && (
                        <div className="flex justify-between gap-4">
                          <span className="uppercase tracking-wider opacity-60">Target ID</span>
                          <span className="text-white/80">{log.targetId}</span>
                        </div>
                      )}
                    </div>
                    {parsedMeta !== null && (
                      <pre
                        className="text-[10px] leading-relaxed text-text-dim whitespace-pre-wrap break-words max-h-64 overflow-y-auto p-3 rounded-lg"
                        style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.05)" }}
                      >
                        {JSON.stringify(parsedMeta, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && data && data.total > data.limit && (
        <div className="flex items-center justify-between mt-8">
          <span className="text-[11px] text-text-muted">
            Showing {(data.page - 1) * data.limit + 1}–{Math.min(data.page * data.limit, data.total)} of {data.total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-lg text-xs bg-white/[0.03] border border-white/[0.06] text-text-muted hover:text-white disabled:opacity-30 transition-all"
            >
              Previous
            </button>
            <span className="px-3 py-2 rounded-lg text-xs bg-white/[0.03] border border-white/[0.06] text-white">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-lg text-xs bg-white/[0.03] border border-white/[0.06] text-text-muted hover:text-white disabled:opacity-30 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
