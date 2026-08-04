"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  roles: { id: string; name: string }[];
}

interface Toast {
  type: "success" | "error";
  text: string;
}

export default function ConfigPage() {
  const [data, setData] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [query, setQuery] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, MemberResult[]>>({});
  const [searching, setSearching] = useState<Record<string, boolean>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});
  const [memberGrant, setMemberGrant] = useState<Record<string, boolean>>({});
  const searchTimeout = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

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

  const runSearch = useCallback((dept: string, q: string) => {
    setSearching((s) => ({ ...s, [dept]: true }));
    fetch(`/api/staff/members?q=${encodeURIComponent(q)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list: MemberResult[]) => setResults((s) => ({ ...s, [dept]: list })))
      .catch(() => setResults((s) => ({ ...s, [dept]: [] })))
      .finally(() => setSearching((s) => ({ ...s, [dept]: false })));
  }, []);

  const onQueryChange = (dept: string, q: string) => {
    setQuery((s) => ({ ...s, [dept]: q }));
    setShowResults((s) => ({ ...s, [dept]: true }));
    const prev = searchTimeout.current[dept];
    if (prev) clearTimeout(prev);
    if (q.trim().length < 2) {
      setResults((s) => ({ ...s, [dept]: [] }));
      return;
    }
    searchTimeout.current[dept] = setTimeout(() => runSearch(dept, q.trim()), 250);
  };

  const addEditor = async (body: { dept: string; granteeType: string; granteeId: string; granteeName?: string }) => {
    try {
      const res = await fetch("/api/staff/app-config/editors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        flash("success", "Editor granted.");
        setQuery((s) => ({ ...s, [body.dept]: "" }));
        setResults((s) => ({ ...s, [body.dept]: [] }));
        setShowResults((s) => ({ ...s, [body.dept]: false }));
        fetchConfig();
      } else {
        const err = await res.json();
        flash("error", err.error || "Failed to grant editor.");
      }
    } catch {
      flash("error", "Network error.");
    }
  };

  const removeEditor = async (dept: string, type: string, id: string) => {
    try {
      const res = await fetch(
        `/api/staff/app-config/editors?dept=${encodeURIComponent(dept)}&type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        flash("success", "Editor revoked.");
        fetchConfig();
      } else {
        const err = await res.json();
        flash("error", err.error || "Failed to revoke editor.");
      }
    } catch {
      flash("error", "Network error.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <Skeleton className="h-6 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="p-6">
              <Skeleton className="h-5 w-40 mb-4" />
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

  const roleOptions = data.roles;

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
          <span className="text-white text-sm">Config</span>
        </div>
        <h1 className="font-display text-2xl tracking-wider text-white">Application Configuration</h1>
        <p className="text-text-muted text-xs mt-1.5">
          Grant question-edit access and manage questions for each application.
        </p>
      </div>

      {toast && (
        <div
          className={`mb-6 px-4 py-3 rounded-xl text-sm ${
            toast.type === "success"
              ? "bg-green-500/10 border border-green-500/20 text-green-400"
              : "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}
        >
          {toast.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.depts.map((dept) => {
          const editors = data.editors[dept.slug] || [];
          return (
            <div
              key={dept.slug}
              className="rounded-2xl p-6"
              style={{
                background: "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-sm tracking-[0.15em] uppercase text-white">{dept.label}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-crimson/25 bg-crimson/10 text-crimson">
                  {editors.length} editor{editors.length === 1 ? "" : "s"}
                </span>
              </div>

              {/* Editor chips */}
              {editors.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-5">
                  {editors.map((e) => (
                    <span
                      key={`${e.granteeType}-${e.granteeId}`}
                      className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border"
                      style={{
                        borderColor: e.granteeType === "role" ? "rgba(59,130,246,0.25)" : "rgba(52,211,153,0.25)",
                        backgroundColor: e.granteeType === "role" ? "rgba(59,130,246,0.08)" : "rgba(52,211,153,0.08)",
                        color: e.granteeType === "role" ? "#93c5fd" : "#6ee7b7",
                      }}
                    >
                      <span className="text-[9px] uppercase tracking-wider opacity-70">
                        {e.granteeType === "role" ? "Role" : "Member"}
                      </span>
                      {e.granteeName}
                      <button
                        onClick={() => removeEditor(dept.slug, e.granteeType, e.granteeId)}
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
                <p className="text-text-muted text-xs mb-5">No editors granted — only Management &amp; Owner can edit.</p>
              )}

              {/* Grant editor */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setMemberGrant((s) => ({ ...s, [dept.slug]: true }))}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    memberGrant[dept.slug]
                      ? "bg-green-500/15 border border-green-500/25 text-green-400"
                      : "bg-white/[0.03] border border-white/[0.06] text-text-muted hover:text-white"
                  }`}
                >
                  Member
                </button>
                <button
                  onClick={() => setMemberGrant((s) => ({ ...s, [dept.slug]: false }))}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    !memberGrant[dept.slug]
                      ? "bg-blue-500/15 border border-blue-500/25 text-blue-400"
                      : "bg-white/[0.03] border border-white/[0.06] text-text-muted hover:text-white"
                  }`}
                >
                  Role
                </button>
              </div>

              {memberGrant[dept.slug] ? (
                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={query[dept.slug] || ""}
                      onChange={(e) => onQueryChange(dept.slug, e.target.value)}
                      onFocus={() => setShowResults((s) => ({ ...s, [dept.slug]: true }))}
                      onBlur={() => setTimeout(() => setShowResults((s) => ({ ...s, [dept.slug]: false })), 200)}
                      placeholder="Search Discord member by name..."
                      className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-text-muted/30 text-xs focus:outline-none focus:border-green-500/40"
                    />
                    {searching[dept.slug] && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border border-green-500/40 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                  {showResults[dept.slug] && (results[dept.slug] || []).length > 0 && (
                    <div
                      className="absolute z-20 left-0 right-0 mt-1.5 rounded-lg overflow-hidden max-h-56 overflow-y-auto"
                      style={{
                        background: "#0b0b0f",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
                      }}
                    >
                      {(results[dept.slug] || []).map((m) => (
                        <button
                          key={m.userId}
                          onMouseDown={() => addEditor({ dept: dept.slug, granteeType: "member", granteeId: m.userId, granteeName: m.username })}
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
                <div className="flex gap-2">
                  <select
                    value=""
                    onChange={(e) => {
                      const id = e.target.value;
                      if (!id) return;
                      const role = data.roles.find((r) => r.id === id);
                      addEditor({ dept: dept.slug, granteeType: "role", granteeId: id, granteeName: role?.name || id });
                      e.target.value = "";
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white text-xs focus:outline-none focus:border-blue-500/40"
                  >
                    <option value="">Grant a Discord role...</option>
                    {roleOptions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Edit questions */}
              <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <Link
                  href={`/staff-panel/config/questions/${dept.slug}`}
                  className="inline-flex items-center gap-2 text-[11px] font-medium text-crimson hover:text-crimson/80 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                  Edit questions
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
