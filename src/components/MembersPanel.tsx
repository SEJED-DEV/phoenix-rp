"use client";

import { useState, useCallback } from "react";

interface Member {
  userId: string;
  username: string;
  avatar: string;
  roles: string[];
  roleNames: string[];
}

interface PunishmentRole {
  id: string;
  name: string;
  color: string;
  severity: number;
}

const PUNISHMENT_ROLES: PunishmentRole[] = [
  { id: "1504840115263115375", name: "Warn 1", color: "#f87171", severity: 1 },
  { id: "1504840113467953173", name: "Warn 2", color: "#ef4444", severity: 2 },
  { id: "1504840114503811122", name: "Warn 3", color: "#dc2626", severity: 3 },
  { id: "1504840124251242578", name: "Staff Warn 2", color: "#b91c1c", severity: 4 },
  { id: "1504840122850345042", name: "Staff Warn 3", color: "#991b1b", severity: 5 },
  { id: "1504840125245554769", name: "Banned", color: "#dc2626", severity: 6 },
  { id: "1504840125690155191", name: "Blacklisted", color: "#7f1d1d", severity: 7 },
];

export default function MembersPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Member[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Member | null>(null);
  const [punishRole, setPunishRole] = useState<string>("");
  const [punishReason, setPunishReason] = useState("");
  const [punishing, setPunishing] = useState(false);
  const [punishResult, setPunishResult] = useState<{ success: boolean; message: string } | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/staff/members?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const getExistingPunishments = (roleIds: string[]): PunishmentRole[] => {
    return PUNISHMENT_ROLES.filter((pr) => roleIds.includes(pr.id));
  };

  const canPunish = (roleIds: string[], targetSeverity: number): { ok: boolean; reason?: string } => {
    const existing = getExistingPunishments(roleIds);
    if (existing.length === 0) return { ok: true };
    const highestSeverity = Math.max(...existing.map((e) => e.severity));
    const highestName = existing.find((e) => e.severity === highestSeverity)!.name;
    if (targetSeverity <= highestSeverity) {
      return { ok: false, reason: `Already has ${highestName} (severity ${highestSeverity}) — can't apply severity ${targetSeverity}` };
    }
    return { ok: true };
  };

  const handlePunish = async () => {
    if (!selected || !punishRole || !punishReason) return;
    setPunishing(true);
    setPunishResult(null);
    try {
      const res = await fetch("/api/staff/punish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: selected.userId,
          targetName: selected.username,
          roleId: punishRole,
          reason: punishReason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPunishResult({ success: true, message: `Punishment applied: ${data.punishment}` });
        setPunishRole("");
        setPunishReason("");
        setSelected((prev) => prev ? { ...prev, roles: [...prev.roles, punishRole] } : prev);
      } else {
        setPunishResult({ success: false, message: data.error || "Failed" });
      }
    } catch {
      setPunishResult({ success: false, message: "Network error" });
    } finally {
      setPunishing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <a href="/staff-panel" className="text-text-muted hover:text-white transition-colors text-sm">
            Staff Panel
          </a>
          <svg className="w-3 h-3 text-text-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-white text-sm">Members</span>
        </div>
        <h1 className="font-display text-2xl tracking-wider text-white">Member Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="relative mb-6">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                search(e.target.value);
              }}
              placeholder="Search by username..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-text-muted/40 text-sm focus:outline-none focus:border-crimson/40 transition-colors"
            />
            {searching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-crimson/40 border-t-crimson rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            {results.length === 0 && query.length >= 2 && !searching && (
              <p className="text-text-muted text-sm text-center py-8">No members found.</p>
            )}
            {results.map((m) => (
              <button
                key={m.userId}
                onClick={() => {
                  setSelected(m);
                  setPunishRole("");
                  setPunishReason("");
                  setPunishResult(null);
                }}
                className="v2-container w-full flex items-center gap-4 p-4 text-left !rounded-xl transition-all duration-300 hover:border-white/[0.12]"
                style={selected?.userId === m.userId ? { borderColor: "rgba(220,38,38,0.25)" } : undefined}
              >
                <img src={m.avatar} alt={m.username} className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{m.username}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {m.roleNames.slice(0, 4).map((name) => (
                      <span key={name} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.05] text-text-muted">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
                <svg className="w-4 h-4 text-text-muted/30 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          {selected ? (
            <div className="v2-container sticky top-24 !rounded-2xl overflow-hidden">
              <div className="p-6 text-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <img src={selected.avatar} alt={selected.username} className="w-16 h-16 rounded-full mx-auto mb-3" />
                <h3 className="text-lg font-display tracking-wider text-white">{selected.username}</h3>
                <p className="text-[11px] text-text-muted mt-1">ID: {selected.userId}</p>
                <div className="flex flex-wrap justify-center gap-1 mt-3">
                  {selected.roleNames.map((name) => (
                    <span key={name} className="text-[9px] px-2 py-0.5 rounded-full bg-white/[0.06] text-text-muted">
                      {name}
                    </span>
                  ))}
                </div>

                {getExistingPunishments(selected.roles).length > 0 && (
                  <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Current Punishments</p>
                    <div className="flex flex-wrap justify-center gap-1">
                      {getExistingPunishments(selected.roles).map((pr) => (
                        <span
                          key={pr.id}
                          className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: `${pr.color}20`, color: pr.color, border: `1px solid ${pr.color}30` }}
                        >
                          {pr.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6">
                <h4 className="font-display text-xs tracking-[0.15em] uppercase text-crimson mb-4">Issue Punishment</h4>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 block">Punishment Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {PUNISHMENT_ROLES.map((pr) => {
                        const { ok, reason } = canPunish(selected.roles, pr.severity);
                        const alreadyHas = selected.roles.includes(pr.id);
                        return (
                          <button
                            key={pr.id}
                            onClick={() => ok && setPunishRole(pr.id)}
                            disabled={!ok}
                            className={`px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${
                              !ok
                                ? "opacity-30 cursor-not-allowed"
                                : punishRole === pr.id
                                  ? "text-white"
                                  : "text-text-muted hover:text-text-dim"
                            }`}
                            style={{
                              background: punishRole === pr.id ? `${pr.color}25` : "rgba(255,255,255,0.03)",
                              border: `1px solid ${punishRole === pr.id ? `${pr.color}40` : "rgba(255,255,255,0.05)"}`,
                            }}
                            title={!ok ? reason : alreadyHas ? "Already has this role" : pr.name}
                          >
                            {pr.name}
                            {alreadyHas && " ✓"}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 block">Reason</label>
                    <textarea
                      value={punishReason}
                      onChange={(e) => setPunishReason(e.target.value)}
                      placeholder="Explain the reason..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-text-muted/30 text-sm focus:outline-none focus:border-crimson/40 resize-none"
                    />
                  </div>

                  <button
                    onClick={handlePunish}
                    disabled={!punishRole || !punishReason || punishing || (selected ? !canPunish(selected.roles, PUNISHMENT_ROLES.find((p) => p.id === punishRole)?.severity ?? 0).ok : true)}
                    className="w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-crimson/20 border border-crimson/30 text-crimson hover:bg-crimson/30"
                  >
                    {punishing ? "Applying..." : "Issue Punishment"}
                  </button>

                  {punishResult && (
                    <p className={`text-xs text-center ${punishResult.success ? "text-green-400" : "text-red-400"}`}>
                      {punishResult.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="v2-container rounded-2xl p-8 text-center">
              <svg className="w-10 h-10 mx-auto mb-3 text-text-muted/20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <p className="text-text-muted text-xs">Search for a member to view their details and issue punishments.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
