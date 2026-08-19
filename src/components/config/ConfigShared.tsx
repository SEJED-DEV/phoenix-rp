"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";

export interface EditorRow {
  dept: string;
  granteeType: string;
  granteeId: string;
  granteeName: string;
  grantedBy: string;
  grantedByUser: string;
  grantedAt: string;
}

export interface DeptInfo {
  slug: string;
  label: string;
  editableByMe: boolean;
}

export interface MemberResult {
  userId: string;
  username: string;
  avatar: string;
  roles: string[];
  roleNames: string[];
}

export interface ConfigData {
  depts: DeptInfo[];
  editors: Record<string, EditorRow[]>;
  viewers: Record<string, EditorRow[]>;
  approvers: Record<string, EditorRow[]>;
  roles: { id: string; name: string }[];
  isHighRank: boolean;
  isSiteOwner?: boolean;
  canEditLinks?: boolean;
  canEditContent?: boolean;
  canEditGallery?: boolean;
  canEditStreamers?: boolean;
}

export interface Toast {
  type: "success" | "error";
  text: string;
}

export type GrantKind = "editor" | "viewer" | "approver";

export interface Accent {
  color: string;
  soft: string;
  icon: ReactNode;
}

// The universal role every staff-panel user holds — granting it affects the whole team.
export const UNIVERSAL_STAFF_ROLE_ID = "1504840075945443513";

export const DEFAULT_ACCENT: Accent = {
  color: "#94a3b8",
  soft: "rgba(148,163,184,0.08)",
  icon: null,
};

export const DEPT_ACCENTS: Record<string, Accent> = {
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

export function grantEndpoint(kind: GrantKind): string {
  if (kind === "viewer") return "/api/staff/app-config/viewers";
  if (kind === "approver") return "/api/staff/app-config/reviewers";
  return "/api/staff/app-config/editors";
}

export function grantLabel(kind: GrantKind): string {
  if (kind === "viewer") return "Viewer";
  if (kind === "approver") return "Approver";
  return "Editor";
}

export type GrantRowLike = Pick<EditorRow, "granteeType" | "granteeId" | "granteeName">;

export function GrantSection({
  kind,
  dept,
  rows,
  roles,
  emptyText,
  onGrant,
  onRevoke,
}: {
  kind: GrantKind;
  dept: string;
  rows: GrantRowLike[];
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

  const accent =
    kind === "viewer"
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
      : kind === "approver"
        ? {
            roleBorder: "rgba(245,158,11,0.25)",
            roleBg: "rgba(245,158,11,0.08)",
            roleText: "#fbbf24",
            memberBorder: "rgba(236,72,153,0.25)",
            memberBg: "rgba(236,72,153,0.08)",
            memberText: "#f9a8d4",
            roleActive: "bg-amber-500/15 border border-amber-500/25 text-amber-400",
            memberActive: "bg-pink-500/15 border border-pink-500/25 text-pink-400",
            roleFocus: "focus:border-amber-500/40",
            memberFocus: "focus:border-pink-500/40",
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

  const accentColor = kind === "viewer" ? "#c084fc" : kind === "approver" ? "#fbbf24" : "#10b981";

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
                style={{ borderColor: accentColor }}
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
