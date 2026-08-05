"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getApplyConfig } from "@/lib/apply.config";
import { Skeleton, SkeletonCard, SkeletonCircle } from "@/components/Skeleton";

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

interface ProfileRole {
  id: string;
  name: string;
  color: string;
}

interface Department {
  name: string;
  type: "department" | "gang";
  color: string;
}

interface Punishment {
  id: string;
  name: string;
  color: string;
  severity: number;
}

interface DetailData {
  application: Application;
  labels: Record<string, string>;
  canReview: boolean;
  profile: {
    username: string;
    avatar: string;
    joinedAt: string | null;
    inGuild: boolean | null;
    highestRole: string | null;
    roles: ProfileRole[];
    curatedRoles: ProfileRole[];
    departments: Department[];
    punishments: Punishment[];
  };
}

interface ProfileStats {
  stats: {
    totalTickets: number;
    openTickets: number;
    inProgressTickets: number;
    closedTickets: number;
  };
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/25" },
  approved: { bg: "bg-green-500/15", text: "text-green-400", border: "border-green-500/25" },
  denied: { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/25" },
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

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function ApplicationDetail() {
  const params = useParams();
  const router = useRouter();
  const dept = params.dept as string;
  const appId = params.id as string;

  const [data, setData] = useState<DetailData | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [acting, setActing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      setData(null);
      setStats(null);
      try {
        const res = await fetch(`/api/staff/applications/${dept}/${appId}`);
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          if (!cancelled) setError(err?.error || "Failed to load application.");
          return;
        }
        const json = (await res.json()) as DetailData;
        if (cancelled) return;
        setData(json);
        const sr = await fetch(`/api/profile/${json.application.discordId}`);
        if (sr.ok && !cancelled) {
          const sjson = (await sr.json()) as ProfileStats;
          setStats(sjson);
        }
      } catch {
        if (!cancelled) setError("Failed to load application.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [dept, appId]);

  const handleReview = async (status: "approved" | "denied") => {
    if (!data) return;
    setActing(true);
    setResult(null);
    try {
      const res = await fetch(`/api/staff/applications/${dept}/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNote: reviewNote || undefined }),
      });
      if (res.ok) {
        setResult({ success: true, message: `Application ${status}` });
        setReviewNote("");
        const ref = await fetch(`/api/staff/applications/${dept}/${appId}`);
        if (ref.ok) setData(await ref.json());
      } else {
        const err = await res.json();
        setResult({ success: false, message: err.error || "Failed" });
      }
    } catch {
      setResult({ success: false, message: "Network error" });
    } finally {
      setActing(false);
    }
  };

  const copyDiscordId = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.application.discordId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <Skeleton className="h-4 w-64 mb-8" />
        <SkeletonCard className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <SkeletonCircle className="w-12 h-12" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </SkeletonCard>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SkeletonCard className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </SkeletonCard>
          </div>
          <div className="space-y-6">
            <SkeletonCard className="p-5">
              <div className="space-y-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-3 w-28" />
              </div>
            </SkeletonCard>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h1 className="font-display text-2xl tracking-wider text-white mb-4">{error || "Application not found."}</h1>
        <button
          onClick={() => router.back()}
          className="px-5 py-2.5 rounded-xl border border-white/[0.08] text-text-dim text-sm font-semibold hover:border-white/[0.15] hover:text-white transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  const { application, labels, canReview, profile } = data;
  const sc = STATUS_COLORS[application.status] || STATUS_COLORS.pending;
  const deptLabel = getApplyConfig(dept)?.label ?? dept.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(application.formData);
  } catch {}

  const fields = Object.entries(parsed);

  const guildBadge =
    profile.inGuild === true
      ? { dot: "bg-green-500", text: "In Server", cls: "text-green-400" }
      : profile.inGuild === false
        ? { dot: "bg-red-500", text: "Not in Server", cls: "text-red-400" }
        : { dot: "bg-white/30", text: "Guild status unknown", cls: "text-text-muted" };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Breadcrumb */}
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
          <Link href={`/staff-panel/applications/${dept}`} className="text-text-muted hover:text-white transition-colors text-sm">
            {deptLabel}
          </Link>
          <svg className="w-3 h-3 text-text-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-white text-sm">#{application.id}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <img
            src={profile.avatar}
            alt=""
            className="w-14 h-14 rounded-full shrink-0 border-2 border-white/[0.1]"
            loading="lazy"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-2xl tracking-wider text-white">{profile.username}</h1>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-medium ${sc.bg} ${sc.text} ${sc.border}`}>
                {application.status}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Application #{application.id} · {deptLabel} · Submitted {formatTimeAgo(application.createdAt)} ({formatFullDate(application.createdAt)})
            </p>
          </div>
          <div className="sm:ml-auto flex items-center gap-2">
            <Link
              href={`/profile/${application.discordId}`}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-white/[0.08] bg-white/[0.03] text-text-dim hover:text-white hover:border-white/[0.15] transition-all"
            >
              Public profile
            </Link>
            <Link
              href={`/staff-panel/applications/${dept}`}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-white/[0.08] bg-white/[0.03] text-text-dim hover:text-white hover:border-white/[0.15] transition-all"
            >
              Back to list
            </Link>
          </div>
        </div>
      </div>

      {result && (
        <div className={`mb-6 px-4 py-3 rounded-xl text-sm stagger-1 ${result.success ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
          {result.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Application answers */}
          <div className="rounded-2xl overflow-hidden stagger-2" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <h2 className="font-display text-sm tracking-[0.15em] uppercase text-text-muted">Application Answers</h2>
            </div>
            <div className="p-5">
              {fields.length === 0 ? (
                <p className="text-sm text-text-muted">No answers recorded.</p>
              ) : (
                fields.map(([key, value], i) => (
                  <div key={key} className={`mb-5 ${i > 0 ? "pt-5" : ""}`} style={i > 0 ? { borderTop: "1px solid rgba(255,255,255,0.04)" } : undefined}>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">
                      {labels[key] || key.replace(/([A-Z])/g, " $1").trim()}
                    </p>
                    <p className="text-sm text-text-dim whitespace-pre-wrap leading-relaxed">{String(value)}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Review controls */}
          <div className="rounded-2xl overflow-hidden stagger-3" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <h2 className="font-display text-sm tracking-[0.15em] uppercase text-text-muted">Review</h2>
            </div>
            <div className="p-5">
              {canReview && application.status === "pending" ? (
                <>
                  <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 block">Review Note (optional)</label>
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Add a note for the applicant..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-text-muted/30 text-sm focus:outline-none focus:border-crimson/40 resize-none mb-3"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReview("approved")}
                      disabled={acting}
                      className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 disabled:opacity-30"
                    >
                      {acting ? "..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleReview("denied")}
                      disabled={acting}
                      className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 disabled:opacity-30"
                    >
                      {acting ? "..." : "Deny"}
                    </button>
                  </div>
                </>
              ) : application.status === "pending" ? (
                <p className="text-xs text-text-muted">
                  You have view access to this application. Only Management &amp; Owner can approve or deny it.
                </p>
              ) : (
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Reviewed by</p>
                  <p className="text-sm text-text-dim">{application.reviewerName || "Unknown"}</p>
                  {application.reviewedAt && (
                    <p className="text-xs text-text-muted mt-0.5">Reviewed {formatFullDate(application.reviewedAt)}</p>
                  )}
                  {application.reviewNote && (
                    <p className="text-xs text-text-muted mt-3 italic" style={{ borderLeft: "2px solid rgba(255,255,255,0.08)", paddingLeft: "0.75rem" }}>
                      &ldquo;{application.reviewNote}&rdquo;
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile sidebar */}
        <div className="space-y-6">
          <div className="rounded-2xl overflow-hidden stagger-2" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <h2 className="font-display text-sm tracking-[0.15em] uppercase text-text-muted">Discord Profile</h2>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <img src={profile.avatar} alt="" className="w-16 h-16 rounded-full shrink-0 border-2 border-white/[0.1]" loading="lazy" />
                <div className="min-w-0">
                  <p className="text-white font-medium text-sm truncate">{profile.username}</p>
                  <span className={`inline-flex items-center gap-1.5 text-[11px] mt-1 ${guildBadge.cls}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${guildBadge.dot}`} />
                    {guildBadge.text}
                  </span>
                </div>
              </div>

              {profile.highestRole && (
                <div className="mb-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-crimson/15 border border-crimson/30 text-crimson">
                    {profile.highestRole}
                  </span>
                </div>
              )}

              {profile.joinedAt && (
                <p className="text-xs text-text-muted mb-4">Joined server {formatFullDate(profile.joinedAt)}</p>
              )}

              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] text-text-muted uppercase tracking-wider">Discord ID</span>
                <button
                  onClick={copyDiscordId}
                  className="text-[10px] text-crimson hover:underline"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="font-mono text-xs text-text-dim bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 mb-5 break-all">
                {application.discordId}
              </p>

              {profile.roles.length > 0 && (
                <div className="mb-5">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Discord Roles</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.roles.map((role) => (
                      <span
                        key={role.id}
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium border border-white/[0.08]"
                        style={{ backgroundColor: `${role.color}15`, color: role.color, borderColor: `${role.color}30` }}
                      >
                        {role.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.departments.length > 0 && (
                <div className="mb-5">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">
                    {profile.departments.some((d) => d.type === "gang") ? "Departments & Families" : "Departments"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.departments.map((deptItem) => (
                      <span
                        key={deptItem.name}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border border-white/[0.08]"
                        style={{ backgroundColor: `${deptItem.color}15`, color: deptItem.color, borderColor: `${deptItem.color}30` }}
                      >
                        {deptItem.type === "gang" && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                        {deptItem.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.punishments.length > 0 && (
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Punishments</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.punishments.map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium border border-white/[0.08]"
                        style={{ backgroundColor: `${p.color}18`, color: p.color, borderColor: `${p.color}35` }}
                      >
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activity */}
          {stats && (
            <div className="rounded-2xl overflow-hidden stagger-3" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <h2 className="font-display text-sm tracking-[0.15em] uppercase text-text-muted">Ticket Activity</h2>
              </div>
              <div className="p-5 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-3 text-center">
                  <p className="text-xl font-semibold text-text">{stats.stats.totalTickets}</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">Total</p>
                </div>
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] p-3 text-center">
                  <p className="text-xl font-semibold text-emerald-400">{stats.stats.openTickets}</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">Open</p>
                </div>
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.05] p-3 text-center">
                  <p className="text-xl font-semibold text-amber-400">{stats.stats.inProgressTickets}</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">In Progress</p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-3 text-center">
                  <p className="text-xl font-semibold text-text-muted">{stats.stats.closedTickets}</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">Closed</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
