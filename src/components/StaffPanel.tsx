"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Skeleton, SkeletonCard, SkeletonCircle } from "@/components/Skeleton";
import { getActionMeta } from "@/lib/staff-actions";

interface DashboardData {
  roleLevel: string;
  canReviewApplications: boolean;
  canEditQuestions: boolean;
  totalMembers: number;
  staffTotal: number;
  pendingApplications: number;
  openTickets: number;
  actionsThisWeek: number;
  todayActions: number;
  activityTrend: { label: string; count: number }[];
  pendingByDept: { slug: string; label: string; pending: number }[];
  recentTickets: { id: string; subject: string; username: string; priority: string; createdAt: string }[];
  recentLogs: {
    id: number;
    actorName: string;
    action: string;
    targetName: string | null;
    reason: string | null;
    createdAt: string;
  }[];
}

interface StaffPanelProps {
  user?: { id: string; username: string; avatar: string } | null;
  roleLevel?: string;
}

const ROLE_META: Record<string, { label: string; accent: string }> = {
  staff: { label: "Staff", accent: "#3b82f6" },
  management: { label: "Management", accent: "#d4a44a" },
  owner: { label: "Owner", accent: "#c41e3a" },
};

const PRIORITY_DOT: Record<string, string> = {
  high: "#ef4444",
  medium: "#d4a44a",
  low: "#6b5e4a",
};

const ICONS = {
  users: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
  badge: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  document: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  chat: "M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z",
  clock: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
  shield: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
  gear: "M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.764-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894zM12 15a3 3 0 100-6 3 3 0 000 6z",
  book: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  arrow: "M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3",
};

function StatCard({
  label,
  value,
  icon,
  accent,
  sub,
  href,
}: {
  label: string;
  value: string | number;
  icon: string;
  accent: string;
  sub?: string;
  href?: string;
}) {
  const body = (
    <div
      className="relative p-5 rounded-2xl overflow-hidden transition-all duration-500 group hover:-translate-y-0.5"
      style={{
        background: "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 0%, ${accent}12 0%, transparent 70%)` }}
      />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <p className="text-text-muted text-[11px] tracking-widest uppercase">{label}</p>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accent}15`, color: accent }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
            </svg>
          </div>
        </div>
        <p className="text-3xl font-display tracking-wider text-white leading-none">{value}</p>
        {sub && <p className="text-[11px] text-text-muted mt-2">{sub}</p>}
      </div>
    </div>
  );
  if (href) {
    return <a href={href} className="block">{body}</a>;
  }
  return body;
}

function Panel({ title, badge, right, children }: { title: string; badge?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-3">
          <h2 className="font-display text-sm tracking-[0.15em] uppercase text-white">{title}</h2>
          {badge && <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-text-muted">{badge}</span>}
        </div>
        {right}
      </div>
      <div className="divide-y divide-white/[0.04]">{children}</div>
    </div>
  );
}

function formatTimeAgo(value: string): string {
  const date = new Date(value.endsWith("Z") || value.includes("T") ? value : value + "Z");
  if (isNaN(date.getTime())) return "";
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function StaffPanel({ user, roleLevel }: StaffPanelProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/staff/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center gap-4 mb-12">
          <SkeletonCircle className="w-14 h-14" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-3 w-72" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          <div className="lg:col-span-2">
            <SkeletonCard>
              <div className="px-6 py-4"><Skeleton className="h-4 w-44" /></div>
              <div className="px-6 py-4"><Skeleton className="h-5 w-full" /></div>
              <div className="px-6 py-4"><Skeleton className="h-5 w-3/4" /></div>
            </SkeletonCard>
          </div>
          <SkeletonCard>
            <div className="px-6 py-4"><Skeleton className="h-4 w-28" /></div>
            <div className="px-6 py-6 space-y-3">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
            </div>
          </SkeletonCard>
        </div>
        <SkeletonCard>
          <div className="px-6 py-4"><Skeleton className="h-4 w-40" /></div>
          <div className="divide-y divide-white/[0.04]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <SkeletonCircle className="w-8 h-8" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </SkeletonCard>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-40">
        <p className="text-text-muted text-sm">Failed to load dashboard.</p>
      </div>
    );
  }

  const tier = ROLE_META[roleLevel || data.roleLevel || "staff"] ?? ROLE_META.staff;
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const trendMax = Math.max(...data.activityTrend.map((t) => t.count), 1);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* ── Header / greeting ─────────────────────────── */}
      <div className="relative mb-12 rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{
          background: "linear-gradient(135deg, rgba(196,30,58,0.10) 0%, rgba(255,255,255,0.02) 45%, rgba(212,164,74,0.05) 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{ background: "radial-gradient(circle at 90% 10%, rgba(196,30,58,0.14) 0%, transparent 55%)" }}
        />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="relative shrink-0">
            <img
              src={user?.avatar}
              alt={user?.username || "Staff"}
              className="w-16 h-16 rounded-2xl object-cover"
              style={{ border: "2px solid rgba(212,164,74,0.35)" }}
            />
            <span
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
              style={{ background: "#050507", border: "1px solid rgba(255,255,255,0.12)", color: tier.accent }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={ICONS.badge} />
              </svg>
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-text-muted text-[11px] tracking-widest uppercase mb-1">Staff Panel · Tunisian Phoenix RP</p>
            <h1 className="font-display text-3xl sm:text-4xl tracking-wider text-white truncate">
              Welcome back, {user?.username || "Officer"}
            </h1>
            <p className="text-text-muted text-xs mt-1.5">{today}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span
              className="text-[11px] font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full"
              style={{ background: `${tier.accent}18`, color: tier.accent, border: `1px solid ${tier.accent}33` }}
            >
              {tier.label}
            </span>
            {user && (
              <a
                href={`/profile/${user.id}`}
                className="text-[11px] tracking-wide text-text-muted hover:text-crimson transition-colors"
              >
                View profile
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Stat cards ────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="Guild Members"
          value={data.totalMembers.toLocaleString()}
          icon={ICONS.users}
          accent="#f59e0b"
        />
        <StatCard
          label="Staff"
          value={data.staffTotal}
          icon={ICONS.badge}
          accent="#3b82f6"
          sub="staff team"
        />
        <StatCard
          label="Pending Apps"
          value={data.pendingApplications}
          icon={ICONS.document}
          accent="#f97316"
          sub="awaiting review"
          href={data.canReviewApplications ? "/staff-panel/applications" : undefined}
        />
        <StatCard
          label="Open Tickets"
          value={data.openTickets}
          icon={ICONS.chat}
          accent="#ef4444"
          sub="needs response"
          href="/tickets"
        />
      </div>

      {/* ── Needs attention + quick actions ───────────── */}
      <div className="grid lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2">
          <Panel
            title="Needs Attention"
            badge={`${data.pendingApplications} apps · ${data.openTickets} tickets`}
            right={
              data.canReviewApplications && data.pendingApplications > 0 ? (
                <Link href="/staff-panel/applications" className="text-[11px] text-text-muted hover:text-crimson transition-colors tracking-wide">Review all</Link>
              ) : undefined
            }
          >
            {/* Pending applications */}
            <div className="px-6 py-4">
              <p className="text-[10px] tracking-widest uppercase text-text-muted mb-3 flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-flame" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={ICONS.document} />
                </svg>
                Pending Applications
                {!data.canReviewApplications && <span className="px-1.5 py-0.5 rounded bg-white/[0.05] text-[9px]">No access</span>}
              </p>
              {data.canReviewApplications ? (
                data.pendingByDept.length === 0 ? (
                  <p className="text-sm text-text-muted">No applications awaiting review. All caught up.</p>
                ) : (
                  <div className="space-y-1">
                    {data.pendingByDept.map((d) => (
                      <a
                        key={d.slug}
                        href={`/staff-panel/applications/${d.slug}`}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors group"
                      >
                        <span className="text-sm text-text-dim group-hover:text-white transition-colors">{d.label}</span>
                        <span className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-semibold text-flame px-2 py-0.5 rounded-full bg-flame/10">{d.pending} pending</span>
                          <svg className="w-3.5 h-3.5 text-text-muted group-hover:text-crimson transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={ICONS.arrow} />
                          </svg>
                        </span>
                      </a>
                    ))}
                  </div>
                )
              ) : (
                <div className="px-3 py-2.5">
                  <p className="text-sm text-text-dim">
                    <span className="text-white">{data.pendingApplications}</span> application{data.pendingApplications === 1 ? "" : "s"} pending
                  </p>
                </div>
              )}
            </div>

            {/* Open tickets */}
            <div className="px-6 py-4">
              <p className="text-[10px] tracking-widest uppercase text-text-muted mb-3 flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-ember" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={ICONS.chat} />
                </svg>
                Open Tickets
              </p>
              {data.recentTickets.length === 0 ? (
                <p className="text-sm text-text-muted">No open tickets right now.</p>
              ) : (
                <div className="space-y-1">
                  {data.recentTickets.map((t) => (
                    <a
                      key={t.id}
                      href={`/tickets/${t.id}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors group"
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PRIORITY_DOT[t.priority] ?? "#6b5e4a" }} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm text-text-dim group-hover:text-white transition-colors truncate">{t.subject}</span>
                        <span className="block text-[11px] text-text-muted truncate">@{t.username}</span>
                      </span>
                      <span className="text-[10px] text-text-muted/50 shrink-0">{formatTimeAgo(t.createdAt)}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* Quick actions */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <h2 className="font-display text-sm tracking-[0.15em] uppercase text-white">Quick Actions</h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {[
              ...(data.canReviewApplications
                ? [{ label: "Review Applications", href: "/staff-panel/applications", icon: ICONS.document, accent: "#f97316" }]
                : []),
              { label: "Manage Members", href: "/staff-panel/members", icon: ICONS.shield, accent: "#3b82f6" },
              { label: "Activity Logs", href: "/staff-panel/logs", icon: ICONS.clock, accent: "#d4a44a" },
              ...(data.canEditQuestions
                ? [{ label: "Config & Editors", href: "/staff-panel/config", icon: ICONS.gear, accent: "#c41e3a" }]
                : []),
              { label: "Docs & Guide", href: "/staff-panel/docs", icon: ICONS.book, accent: "#6b5e4a" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="group flex items-center gap-3 px-6 py-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${item.accent}12`, color: item.accent }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <span className="flex-1 text-sm text-text-dim group-hover:text-white transition-colors">{item.label}</span>
                <svg className="w-3.5 h-3.5 text-text-muted/40 group-hover:text-crimson transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={ICONS.arrow} />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Activity trend + recent activity ──────────── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Activity trend */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <h2 className="font-display text-sm tracking-[0.15em] uppercase text-white">Activity</h2>
            <span className="text-[9px] uppercase tracking-wider text-text-muted/60">actions · last 7 days</span>
          </div>
          <div className="px-6 py-5">
            <div className="flex items-end gap-1.5 h-20 mb-2">
              {data.activityTrend.map((t, i) => (
                <div
                  key={i}
                  title={`${t.label}: ${t.count} action${t.count === 1 ? "" : "s"}`}
                  className="flex-1 rounded-t transition-all duration-500"
                  style={{
                    height: `${Math.max((t.count / trendMax) * 80, 4)}px`,
                    background:
                      t.count === 0
                        ? "rgba(255,255,255,0.05)"
                        : "linear-gradient(180deg, rgba(212,164,74,0.8) 0%, rgba(212,164,74,0.2) 100%)",
                    boxShadow: t.count > 0 ? "0 0 14px rgba(212,164,74,0.18)" : undefined,
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between text-[9px] text-text-muted/60 uppercase tracking-wider">
              {data.activityTrend.map((t, i) => (
                <span key={i}>{t.label}</span>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="text-xs text-text-muted">
                <span className="text-white font-semibold">{data.actionsThisWeek}</span> actions this week
              </span>
              <span className="text-xs text-text-muted">
                <span className="text-flame font-semibold">{data.todayActions}</span> today
              </span>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="lg:col-span-2">
          <Panel
            title="Recent Activity"
            right={
              <a href="/staff-panel/logs" className="text-[11px] text-text-muted hover:text-crimson transition-colors tracking-wide">View all</a>
            }
          >
            {data.recentLogs.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-text-muted text-sm">No activity yet.</p>
              </div>
            ) : (
              data.recentLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-4 px-6 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={ICONS.clock} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-dim truncate">
                      <span className="text-white">{log.actorName}</span>
                      {" "}
                      <span className="text-text-muted">{getActionMeta(log.action).label}</span>
                      {log.targetName && (
                        <>
                          {" "}
                          <span className="text-crimson">{log.targetName}</span>
                        </>
                      )}
                    </p>
                    {log.reason && (
                      <p className="text-[11px] text-text-muted truncate mt-0.5">Reason: {log.reason}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-text-muted/50 shrink-0">{formatTimeAgo(log.createdAt)}</span>
                </div>
              ))
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
