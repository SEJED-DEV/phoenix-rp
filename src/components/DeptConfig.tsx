"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/Skeleton";
import {
  DEPT_ACCENTS,
  DEFAULT_ACCENT,
  grantEndpoint,
  grantLabel,
  GrantSection,
  type ConfigData,
  type GrantKind,
  type Toast,
} from "@/components/config/ConfigShared";

export default function DeptConfig({ slug, label }: { slug: string; label: string }) {
  const [data, setData] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/staff/app-config")
      .then(async (r) => (r.ok ? r.json() : null))
      .then((d: ConfigData | null) => {
        if (cancelled || !d) return;
        setData(d);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const refetch = async () => {
    try {
      const res = await fetch("/api/staff/app-config");
      if (res.ok) setData(await res.json());
    } catch {}
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const flash = (type: Toast["type"], text: string) => setToast({ type, text });

  const grant = async (kind: GrantKind, body: { dept: string; granteeType: string; granteeId: string; granteeName?: string }) => {
    const labelKind = grantLabel(kind);
    try {
      const res = await fetch(grantEndpoint(kind), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        flash("success", `${labelKind} granted.`);
        refetch();
      } else {
        const err = await res.json();
        flash("error", err.error || `Failed to grant ${labelKind.toLowerCase()}.`);
      }
    } catch {
      flash("error", "Network error.");
    }
  };

  const revoke = async (kind: GrantKind, dept: string, type: string, id: string) => {
    const labelKind = grantLabel(kind);
    const query = `dept=${encodeURIComponent(dept)}&type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`;
    try {
      const res = await fetch(`${grantEndpoint(kind)}?${query}`, { method: "DELETE" });
      if (res.ok) {
        flash("success", `${labelKind} revoked.`);
        refetch();
      } else {
        const err = await res.json();
        flash("error", err.error || `Failed to revoke ${labelKind.toLowerCase()}.`);
      }
    } catch {
      flash("error", "Network error.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Skeleton className="h-3 w-40 mb-3" />
        <Skeleton className="h-6 w-52 mb-8" />
        <Skeleton className="h-48 w-full mb-4 rounded-2xl" />
        <Skeleton className="h-48 w-full mb-4 rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-40">
        <p className="text-text-muted text-sm">Failed to load configuration.</p>
      </div>
    );
  }

  const accent = DEPT_ACCENTS[slug] || DEFAULT_ACCENT;
  const editors = data.editors[slug] || [];
  const viewers = data.viewers[slug] || [];
  const approvers = data.approvers[slug] || [];

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-8 stagger-1">
        <div className="flex items-center gap-3 mb-3 text-sm">
          <Link href="/staff-panel" className="text-text-muted hover:text-white transition-colors">
            Staff Panel
          </Link>
          <svg className="w-3 h-3 text-text-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/staff-panel/config" className="text-text-muted hover:text-white transition-colors">
            Config
          </Link>
          <svg className="w-3 h-3 text-text-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-white">{label}</span>
        </div>

        <div
          className="flex items-center gap-3 mb-4 p-5 rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ color: accent.color, backgroundColor: accent.soft, border: `1px solid ${accent.color}25` }}
          >
            {accent.icon}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl tracking-[0.15em] uppercase text-white">{label}</h1>
            <p className="text-[10px] text-text-muted mt-0.5">
              {data.isHighRank ? "Question editors, reviewers &amp; approvers" : "You have editor access to the questions."}
            </p>
          </div>
          <span
            className="text-[10px] px-2.5 py-0.5 rounded-full border shrink-0"
            style={{ color: accent.color, borderColor: `${accent.color}30`, backgroundColor: `${accent.color}10` }}
          >
            {editors.length + viewers.length + approvers.length} grants
          </span>
        </div>
      </div>

      {toast && (
        <div
          className={`mb-6 px-4 py-3 rounded-xl text-sm stagger-1 ${
            toast.type === "success"
              ? "bg-green-500/10 border border-green-500/20 text-green-400"
              : "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}
        >
          {toast.text}
        </div>
      )}

      {data.isHighRank ? (
        <div className="relative rounded-2xl p-6 stagger-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#34d399" }} />
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">Question Editors</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-400">
                {editors.length}
              </span>
            </div>
            <GrantSection
              kind="editor"
              dept={slug}
              rows={editors}
              roles={data.roles}
              emptyText="No editors granted — only Management &amp; Owner can edit."
              onGrant={(body) => grant("editor", body)}
              onRevoke={(d, type, id) => revoke("editor", d, type, id)}
            />
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#c084fc" }} />
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">Application Reviewers</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-purple-500/25 bg-purple-500/10 text-purple-400">
                {viewers.length}
              </span>
            </div>
            <GrantSection
              kind="viewer"
              dept={slug}
              rows={viewers}
              roles={data.roles}
              emptyText="No reviewers granted — only Management &amp; Owner can view."
              onGrant={(body) => grant("viewer", body)}
              onRevoke={(d, type, id) => revoke("viewer", d, type, id)}
            />
          </div>

          <div className="mb-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#fbbf24" }} />
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">Application Approvers</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-amber-500/25 bg-amber-500/10 text-amber-400">
                {approvers.length}
              </span>
            </div>
            <GrantSection
              kind="approver"
              dept={slug}
              rows={approvers}
              roles={data.roles}
              emptyText="No approvers granted — only Management &amp; Owner can approve or deny."
              onGrant={(body) => grant("approver", body)}
              onRevoke={(d, type, id) => revoke("approver", d, type, id)}
            />
          </div>
        </div>
      ) : (
        <p
          className="mb-6 px-4 py-3 rounded-xl text-xs text-text-muted stagger-2"
          style={{ background: "rgba(255,255,255,0.015)", border: "1px dashed rgba(255,255,255,0.06)" }}
        >
          You can edit the questions for this department. Grant management is only available to Management &amp; Owner.
        </p>
      )}

      <div className="mt-6 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <Link
          href={`/staff-panel/config/questions/${slug}`}
          className="inline-flex items-center gap-2 text-[11px] font-medium transition-colors"
          style={{ color: accent.color }}
        >
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md" style={{ backgroundColor: `${accent.color}12`, border: `1px solid ${accent.color}20` }}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </span>
          Edit questions
        </Link>
      </div>
    </div>
  );
}
