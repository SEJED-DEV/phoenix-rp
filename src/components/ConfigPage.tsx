"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";

interface EditorRow {
  dept: string;
  granteeType: string;
  granteeId: string;
  granteeName: string;
  grantedBy: string;
  grantedByUser: string;
  grantedAt: string;
}

interface DeptInfo {
  slug: string;
  label: string;
  editableByMe: boolean;
}

interface MemberResult {
  userId: string;
  username: string;
  avatar: string;
  roles: string[];
  roleNames: string[];
}

interface ConfigData {
  depts: DeptInfo[];
  editors: Record<string, EditorRow[]>;
  viewers: Record<string, EditorRow[]>;
  roles: { id: string; name: string }[];
  isHighRank: boolean;
}

interface Toast {
  type: "success" | "error";
  text: string;
}

interface Accent {
  color: string;
  soft: string;
  icon: ReactNode;
}

// The universal role every staff-panel user holds — granting it affects the whole team.
const UNIVERSAL_STAFF_ROLE_ID = "1504840075945443513";

const DEFAULT_ACCENT: Accent = {
  color: "#94a3b8",
  soft: "rgba(148,163,184,0.08)",
  icon: null,
};

const DEPT_ACCENTS: Record<string, Accent> = {
  whitelist: {
    color: "#10b981",
    soft: "rgba(16,185,129,0.08)",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
      </svg>
    ),
  },
  family: {
    color: "#a855f7",
    soft: "rgba(168,85,247,0.08)",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  staff_staffteam: {
    color: "#60a5fa",
    soft: "rgba(96,165,250,0.08)",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  "ban-appeal": {
    color: "#f43f5e",
    soft: "rgba(244,63,94,0.08)",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
      </svg>
    ),
  },
};

function GrantSection({
  kind,
  dept,
  rows,
  roles,
  emptyText,
  onGrant,
  onRevoke,
}: {
  kind: "editor" | "viewer";
  dept: string;
  rows: EditorRow[];
  roles: { id: string; name: string }[];
  emptyText: string;
  onGrant: (body: { dept: string; granteeType: string; granteeId: string; granteeName?: string }) => void;
  onRevoke: (dept: string, type: string, id: string) => void;
}) {
  const [memberMode, setMemberMode] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemberResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isViewer = kind === "viewer";
  const accent = isViewer
    ? {
        roleBorder: "rgba(139,92,246,0.25)",
        roleBg: "rgba(139,92,246,0.08)",
        roleText: "#c4b5fd",
        memberBorder: "rgba(217,70,239,0.25)",
        memberBg: "rgba(217,70,239,0.08)",
        memberText: "#f0abfc",
        roleActive: "bg-purple-500/15 border border-purple-500/25 text-purple-400",
        memberActive: "bg-fuchsia-500/15 border border-fuchsia-500/25 text-fuchsia-400",
        roleFocus: "focus:border-purple-500/40",
        memberFocus: "focus:border-fuchsia-500/40",
      }
    : {
        roleBorder: "rgba(59,130,246,0.25)",
        roleBg: "rgba(59,130,246,0.08)",
        roleText: "#93c5fd",
        memberBorder: "rgba(52,211,153,0.25)",
        memberBg: "rgba(52,211,153,0.08)",
        memberText: "#6ee7b7",
        roleActive: "bg-blue-500/15 border border-blue-500/25 text-blue-400",
        memberActive: "bg-green-500/15 border border-green-500/25 text-green-400",
        roleFocus: "focus:border-blue-500/40",
        memberFocus: "focus:border-green-500/40",
      };

  const runSearch = (q: string) => {
    setSearching(true);
    fetch(`/api/staff/members?q=${encodeURIComponent(q)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list: MemberResult[]) => setResults(list))
      .catch(() => setResults([]))
      .finally(() => setSearching(false));
  };

  const onQueryChange = (q: string) => {
    setQuery(q);
    setShowResults(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    searchTimeout.current = setTimeout(() => runSearch(q.trim()), 250);
  };

  const pickRole = (id: string) => {
    const role = roles.find((r) => r.id === id);
    if (id === UNIVERSAL_STAFF_ROLE_ID) {
      const ok = window.confirm(
        "This grants access to EVERY member holding the ⚙️ | Staff Team role. Continue?",
      );
      if (!ok) return;
    }
    onGrant({ dept, granteeType: "role", granteeId: id, granteeName: role?.name || id });
  };

  const inputClass = `w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-text-muted/30 text-xs focus:outline-none ${memberMode ? accent.memberFocus : accent.roleFocus}`;

  return (
    <div>
      {rows.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-4">
          {rows.map((e) => (
            <span
              key={`${e.granteeType}-${e.granteeId}`}
              className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border"
              style={{
                borderColor: e.granteeType === "role" ? accent.roleBorder : accent.memberBorder,
                backgroundColor: e.granteeType === "role" ? accent.roleBg : accent.memberBg,
                color: e.granteeType === "role" ? accent.roleText : accent.memberText,
              }}
            >
              <span className="text-[9px] uppercase tracking-wider opacity-70">
                {e.granteeType === "role" ? "Role" : "Member"}
              </span>
              {e.granteeName}
              <button
                onClick={() => onRevoke(dept, e.granteeType, e.granteeId)}
                className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
                aria-label={`Remove ${e.granteeName}`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p
          className="mb-4 px-3 py-2.5 rounded-lg text-xs text-text-muted"
          style={{ background: "rgba(255,255,255,0.015)", border: "1px dashed rgba(255,255,255,0.06)" }}
        >
          {emptyText}
        </p>
      )}

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setMemberMode(true)}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
            memberMode ? accent.memberActive : "bg-white/[0.03] border border-white/[0.06] text-text-muted hover:text-white"
          }`}
        >
          Member
        </button>
        <button
          onClick={() => setMemberMode(false)}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
            !memberMode ? accent.roleActive : "bg-white/[0.03] border border-white/[0.06] text-text-muted hover:text-white"
          }`}
        >
          Role
        </button>
      </div>

      {memberMode ? (
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              placeholder="Search Discord member by name..."
              className={inputClass}
            />
            {searching && (
              <div
                className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border border-t-transparent rounded-full animate-spin"
                style={{ borderColor: isViewer ? "#c084fc" : "#10b981" }}
              />
            )}
          </div>
          {showResults && results.length > 0 && (
            <div
              className="absolute z-20 left-0 right-0 mt-1.5 rounded-lg overflow-hidden max-h-56 overflow-y-auto"
              style={{
                background: "#0b0b0f",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
              }}
            >
              {results.map((m) => (
                <button
                  key={m.userId}
                  onMouseDown={() =>
                    onGrant({ dept, granteeType: "member", granteeId: m.userId, granteeName: m.username })
                  }
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.04] transition-colors"
                >
                  <img src={m.avatar} alt="" className="w-7 h-7 rounded-full" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-white truncate">{m.username}</p>
                    {m.roleNames && m.roleNames.length > 0 && (
                      <p className="text-[9px] text-text-muted truncate">{m.roleNames.slice(0, 3).join(" · ")}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) {
              pickRole(e.target.value);
              e.target.value = "";
            }
          }}
          className={`w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white text-xs focus:outline-none ${memberMode ? accent.memberFocus : accent.roleFocus}`}
        >
          <option value="">Grant a Discord role...</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      )}
      <p className="mt-2 text-[10px] text-text-muted/60">
        {memberMode
          ? "Members grant access to one person."
          : "Roles grant access to everyone holding that role — use Member to grant specific people."}
      </p>
    </div>
  );
}

export default function ConfigPage() {
  const [data, setData] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/app-config");
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const flash = (type: Toast["type"], text: string) => setToast({ type, text });

  const grant = async (kind: "editor" | "viewer", body: { dept: string; granteeType: string; granteeId: string; granteeName?: string }) => {
    const isViewer = kind === "viewer";
    const label = isViewer ? "Viewer" : "Editor";
    try {
      const res = await fetch(`/api/staff/app-config/${isViewer ? "viewers" : "editors"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        flash("success", `${label} granted.`);
        fetchConfig();
      } else {
        const err = await res.json();
        flash("error", err.error || `Failed to grant ${label.toLowerCase()}.`);
      }
    } catch {
      flash("error", "Network error.");
    }
  };

  const revoke = async (kind: "editor" | "viewer", dept: string, type: string, id: string) => {
    const isViewer = kind === "viewer";
    const label = isViewer ? "Viewer" : "Editor";
    try {
      const res = await fetch(
        `/api/staff/app-config/${isViewer ? "viewers" : "editors"}?dept=${encodeURIComponent(dept)}&type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        flash("success", `${label} revoked.`);
        fetchConfig();
      } else {
        const err = await res.json();
        flash("error", err.error || `Failed to revoke ${label.toLowerCase()}.`);
      }
    } catch {
      flash("error", "Network error.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <Skeleton className="h-3 w-32 mb-3" />
        <Skeleton className="h-6 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <Skeleton className="w-9 h-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-8 w-full" />
            </SkeletonCard>
          ))}
        </div>
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

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8 stagger-1">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/staff-panel" className="text-text-muted hover:text-white transition-colors text-sm">
            Staff Panel
          </Link>
          <svg className="w-3 h-3 text-text-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-white text-sm">Config</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-5 h-px" style={{ background: "linear-gradient(90deg, rgba(212,164,74,0.8), transparent)" }} />
          <span className="text-[10px] font-display tracking-[0.25em] uppercase text-gold">Site Administration</span>
        </div>
        <h1 className="font-display text-2xl tracking-wider text-white">Application Configuration</h1>
        <p className="text-text-muted text-xs mt-1.5">
          Control who edits questions and who can review applications, then manage the questions and site-wide FAQ content.
        </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(data.isHighRank ? data.depts : data.depts.filter((d) => d.editableByMe)).map((dept, i) => {
          const editors = data.editors[dept.slug] || [];
          const viewers = data.viewers[dept.slug] || [];
          const accent = DEPT_ACCENTS[dept.slug] || DEFAULT_ACCENT;
          const grantCount = editors.length + viewers.length;
          return (
            <div
              key={dept.slug}
              className={`relative rounded-2xl overflow-hidden stagger-${Math.min(i + 2, 5)}`}
              style={{
                background: "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg, ${accent.color}50, rgba(255,255,255,0.02) 65%, transparent)` }}
              />

              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ color: accent.color, backgroundColor: accent.soft, border: `1px solid ${accent.color}25` }}
                  >
                    {accent.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-sm tracking-[0.15em] uppercase text-white">{dept.label}</h2>
                    <p className="text-[10px] text-text-muted mt-0.5">Question editors &amp; application viewers</p>
                  </div>
                  <span
                    className="text-[10px] px-2.5 py-0.5 rounded-full border shrink-0"
                    style={{ color: accent.color, borderColor: `${accent.color}30`, backgroundColor: `${accent.color}10` }}
                  >
                    {grantCount} grant{grantCount === 1 ? "" : "s"}
                  </span>
                </div>

                {data.isHighRank ? (
                  <>
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#34d399" }} />
                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">
                          Question Editors
                        </p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-400">
                          {editors.length}
                        </span>
                      </div>
                      <GrantSection
                        kind="editor"
                        dept={dept.slug}
                        rows={editors}
                        roles={data.roles}
                        emptyText="No editors granted — only Management &amp; Owner can edit."
                        onGrant={(body) => grant("editor", body)}
                        onRevoke={(d, type, id) => revoke("editor", d, type, id)}
                      />
                    </div>

                    <div className="mb-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#c084fc" }} />
                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">
                          Application Reviewers
                        </p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-purple-500/25 bg-purple-500/10 text-purple-400">
                          {viewers.length}
                        </span>
                      </div>
                      <GrantSection
                        kind="viewer"
                        dept={dept.slug}
                        rows={viewers}
                        roles={data.roles}
                        emptyText="No reviewers granted — only Management &amp; Owner can view."
                        onGrant={(body) => grant("viewer", body)}
                        onRevoke={(d, type, id) => revoke("viewer", d, type, id)}
                      />
                    </div>
                  </>
                ) : (
                  <p
                    className="mb-5 px-3 py-2.5 rounded-lg text-xs text-text-muted"
                    style={{ background: "rgba(255,255,255,0.015)", border: "1px dashed rgba(255,255,255,0.06)" }}
                  >
                    You can edit the questions for this department. Grant management is only available to Management &amp; Owner.
                  </p>
                )}

                <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <Link
                    href={`/staff-panel/config/questions/${dept.slug}`}
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
            </div>
          );
        })}
      </div>

      {/* FAQ editor */}
      {data.isHighRank && (
      <div
        className="relative mt-6 rounded-2xl overflow-hidden stagger-4"
        style={{
          background: "linear-gradient(160deg, rgba(212,164,74,0.04) 0%, rgba(255,255,255,0.01) 100%)",
          border: "1px solid rgba(212,164,74,0.15)",
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, rgba(212,164,74,0.5), rgba(255,255,255,0.02) 65%, transparent)" }} />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-gold"
              style={{ background: "rgba(212,164,74,0.08)", border: "1px solid rgba(212,164,74,0.25)" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-sm tracking-[0.15em] uppercase text-white">FAQ</h2>
              <p className="text-[10px] text-text-muted mt-0.5">Site-wide content</p>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-gold/25 bg-gold/10 text-gold shrink-0">
              Site-wide
            </span>
          </div>
          <p className="text-text-muted text-xs mb-4">
            Edit the questions and answers shown on the public /faq page. Applies immediately to all visitors.
          </p>
          <Link
            href="/staff-panel/config/faq"
            className="inline-flex items-center gap-2 text-[11px] font-medium text-gold hover:text-gold/80 transition-colors"
          >
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-md" style={{ background: "rgba(212,164,74,0.12)", border: "1px solid rgba(212,164,74,0.2)" }}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </span>
            Edit FAQ questions
          </Link>
        </div>
      </div>
      )}
    </div>
  );
}
