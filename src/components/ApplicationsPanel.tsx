"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";

interface DeptSummary {
  slug: string;
  label: string;
  pending: number;
  approved: number;
  denied: number;
  total: number;
}

const DEPT_ICONS: Record<string, string> = {
  whitelist: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  police: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
  ems: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z",
  mechanic: "M11.42 15.17l-5.1-5.1m5.1 5.1L17 21m-5.58-5.83l5.1-5.1m-5.1 5.1L6 21M3 3l4.24 4.24m13.52 0L21 3m0 18l-4.24-4.24m-13.52 0L3 21",
  family: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
  doj: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
  staff_staffteam: "M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z",
  "ban-appeal": "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z",
};

export default function ApplicationsPanel() {
  const { status } = useAuth();
  const [data, setData] = useState<DeptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    fetch("/api/staff/applications")
      .then((r) => {
        if (r.status === 403) {
          setAccessDenied(true);
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-3 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-3 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} className="p-5">
              <Skeleton className="h-3 w-16 mb-3" />
              <Skeleton className="h-8 w-20 mb-3" />
              <Skeleton className="h-3 w-24" />
            </SkeletonCard>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} className="p-5">
              <div className="flex items-start justify-between mb-4">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-3 w-32 mb-5" />
              <Skeleton className="h-1.5 w-full mb-2.5" />
              <Skeleton className="h-3 w-28" />
            </SkeletonCard>
          ))}
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-40 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <h1 className="font-display text-3xl tracking-wider text-white mb-3">Access Denied</h1>
        <p className="text-text-muted text-sm">You need management permissions to review applications.</p>
      </div>
    );
  }

  const totalPending = data.reduce((sum, d) => sum + d.pending, 0);
  const totalApproved = data.reduce((sum, d) => sum + d.approved, 0);
  const totalDenied = data.reduce((sum, d) => sum + d.denied, 0);
  const totalAll = data.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10 stagger-1">
        <div className="flex items-center gap-3 mb-2">
          <a href="/staff-panel" className="text-text-muted hover:text-white transition-colors text-sm">
            Staff Panel
          </a>
          <svg className="w-3 h-3 text-text-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-white text-sm">Applications</span>
        </div>
        <h1 className="font-display text-2xl tracking-wider text-white">Applications</h1>
        <p className="text-text-muted text-xs mt-1">
          {totalPending > 0 ? `${totalPending} pending application${totalPending === 1 ? "" : "s"} awaiting review` : "No pending applications"}
        </p>
      </div>

      {/* Overall summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="stagger-2 rounded-2xl p-5" style={{ background: "linear-gradient(160deg, rgba(249,115,22,0.10) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(249,115,22,0.2)" }}>
          <p className="text-[11px] tracking-widest uppercase text-orange-400 mb-1">Pending</p>
          <p className="text-3xl font-display tracking-wider text-white leading-none">{totalPending}</p>
          <p className="text-[11px] text-text-muted mt-2">awaiting review</p>
        </div>
        <div className="stagger-3 rounded-2xl p-5" style={{ background: "linear-gradient(160deg, rgba(34,197,94,0.10) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(34,197,94,0.2)" }}>
          <p className="text-[11px] tracking-widest uppercase text-green-400 mb-1">Approved</p>
          <p className="text-3xl font-display tracking-wider text-white leading-none">{totalApproved}</p>
          <p className="text-[11px] text-text-muted mt-2">accepted applications</p>
        </div>
        <div className="stagger-4 rounded-2xl p-5" style={{ background: "linear-gradient(160deg, rgba(239,68,68,0.10) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <p className="text-[11px] tracking-widest uppercase text-red-400 mb-1">Denied</p>
          <p className="text-3xl font-display tracking-wider text-white leading-none">{totalDenied}</p>
          <p className="text-[11px] text-text-muted mt-2">of {totalAll} total</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((dept, i) => {
          const pct = dept.total > 0 ? (dept.pending / dept.total) * 100 : 0;
          const approvedPct = dept.total > 0 ? (dept.approved / dept.total) * 100 : 0;
          const deniedPct = dept.total > 0 ? (dept.denied / dept.total) * 100 : 0;
          return (
            <Link
              key={dept.slug}
              href={`/staff-panel/applications/${dept.slug}`}
              className={`group relative p-5 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 stagger-${Math.min(i + 1, 3)}`}
              style={{
                background: "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                border: `1px solid ${dept.pending > 0 ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.05)"}`,
              }}
            >
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: "radial-gradient(circle at 50% 0%, rgba(220,38,38,0.06) 0%, transparent 70%)" }}
              />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center text-text-muted group-hover:text-crimson transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={DEPT_ICONS[dept.slug] || DEPT_ICONS.whitelist} />
                    </svg>
                  </div>
                  {dept.pending > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-medium">
                      {dept.pending} pending
                    </span>
                  )}
                </div>
                <h3 className="font-display text-sm tracking-wider text-white mb-1 group-hover:text-crimson transition-colors">
                  {dept.label}
                </h3>
                <p className="text-[11px] text-text-muted mb-4">
                  {dept.total} total application{dept.total === 1 ? "" : "s"}
                </p>

                {/* Status bar */}
                <div className="h-1.5 rounded-full overflow-hidden flex mb-2.5" style={{ background: "rgba(255,255,255,0.05)" }}>
                  {dept.pending > 0 && <div className="bg-orange-400" style={{ width: `${pct}%` }} />}
                  {dept.approved > 0 && <div className="bg-green-500" style={{ width: `${approvedPct}%` }} />}
                  {dept.denied > 0 && <div className="bg-red-500" style={{ width: `${deniedPct}%` }} />}
                </div>
                <div className="flex gap-3 text-[10px] text-text-muted">
                  <span><span className="text-orange-400 font-semibold">{dept.approved}</span> approved</span>
                  <span><span className="text-red-400 font-semibold">{dept.denied}</span> denied</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
