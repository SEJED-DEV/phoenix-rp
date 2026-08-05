"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getApplyConfig } from "@/lib/apply.config";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";

interface Application {
  id: number;
  discordId: string;
  username: string;
  formData: string;
  status: string;
  reviewerId: string | null;
  reviewerName: string | null;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

interface PaginatedResult {
  applications: Application[];
  total: number;
  labels?: Record<string, string>;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/25" },
  approved: { bg: "bg-green-500/15", text: "text-green-400", border: "border-green-500/25" },
  denied: { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/25" },
};

const STATUS_DOT: Record<string, string> = {
  pending: "bg-orange-400",
  approved: "bg-green-500",
  denied: "bg-red-500",
};

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr + "Z");
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function discordAvatar(discordId: string): string {
  const idx = Number(discordId.slice(-1) || "0") % 5;
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}

function firstAnswerPreview(formData: string): string {
  try {
    const parsed = JSON.parse(formData) as Record<string, unknown>;
    const first = Object.values(parsed)[0];
    if (typeof first === "string") return first.length > 60 ? `${first.slice(0, 60)}…` : first;
  } catch {}
  return "";
}

export default function ApplicationReview() {
  const params = useParams();
  const dept = params.dept as string;

  const [data, setData] = useState<PaginatedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (statusFilter) qs.set("status", statusFilter);
    if (search) qs.set("q", search);
    qs.set("page", String(page));
    try {
      const res = await fetch(`/api/staff/applications/${dept}?${qs}`);
      if (res.status === 403) {
        setDenied(true);
      } else if (res.ok) {
        setDenied(false);
        setData(await res.json());
      }
    } catch {}
    setLoading(false);
  }, [dept, statusFilter, search, page]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const deptLabel = getApplyConfig(dept)?.label ?? dept.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8 stagger-1">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/staff-panel" className="text-text-muted hover:text-white transition-colors text-sm">
            Staff Panel
          </Link>
          <svg className="w-3 h-3 text-text-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/staff-panel/applications" className="text-text-muted hover:text-white transition-colors text-sm">
            Applications
          </Link>
          <svg className="w-3 h-3 text-text-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-white text-sm">{deptLabel}</span>
        </div>
        <h1 className="font-display text-2xl tracking-wider text-white">{deptLabel} Applications</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 stagger-2">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { label: "All", value: "" },
            { label: "Pending", value: "pending" },
            { label: "Approved", value: "approved" },
            { label: "Denied", value: "denied" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                statusFilter === tab.value
                  ? "bg-crimson/20 border border-crimson/30 text-crimson"
                  : "bg-white/[0.03] border border-white/[0.05] text-text-muted hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs ml-auto">
          <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by username..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-text-muted/30 text-xs focus:outline-none focus:border-crimson/40 transition-colors"
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted/50 hover:text-white transition-colors"
              aria-label="Clear search"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-3xl">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                </div>
              </SkeletonCard>
            ))}
          </div>
        ) : denied ? (
          <div className="rounded-2xl py-20 text-center" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-text-muted text-sm">You don&apos;t have access to this application queue. Ask a Manager to grant you access in Config.</p>
          </div>
        ) : !data || data.applications.length === 0 ? (
          <div className="rounded-2xl py-20 text-center" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-text-muted text-sm">{search ? `No applications match "${search}".` : "No applications found."}</p>
            {search && (
              <button
                onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
                className="mt-3 text-xs text-crimson hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {data.applications.map((app, i) => {
              const sc = STATUS_COLORS[app.status] || STATUS_COLORS.pending;
              const preview = firstAnswerPreview(app.formData);
              return (
                <Link
                  key={app.id}
                  href={`/staff-panel/applications/${dept}/${app.id}`}
                  className={`group w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-300 hover:-translate-y-0.5 stagger-${Math.min(i + 1, 5)}`}
                  style={{
                    background: "linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <img
                    src={discordAvatar(app.discordId)}
                    alt=""
                    className="w-9 h-9 rounded-full shrink-0"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white font-medium truncate">{app.username}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${sc.bg} ${sc.text} ${sc.border}`}>
                        {app.status}
                      </span>
                    </div>
                    {preview && (
                      <p className="text-[11px] text-text-muted truncate mt-1">{preview}</p>
                    )}
                    <p className="text-[10px] text-text-muted/50 mt-1">#{app.id} · {formatTimeAgo(app.createdAt)}</p>
                  </div>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[app.status] || "bg-white/20"}`} />
                  <svg className="w-4 h-4 text-text-muted/30 group-hover:text-white/60 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs transition-all ${
                  p === page ? "bg-crimson/20 border border-crimson/30 text-crimson" : "bg-white/[0.03] text-text-muted hover:text-white"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
