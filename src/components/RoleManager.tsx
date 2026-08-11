"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface Member {
  userId: string;
  username: string;
  avatar: string;
  roles: string[];
  roleNames: string[];
}

interface ManageableRole {
  id: string;
  name: string;
  color: string;
  position: number;
}

interface RolesData {
  manageable: ManageableRole[];
  actorHighest: { id: string; name: string; position: number } | null;
  roleNames: Record<string, string>;
}

export default function RoleManager() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Member[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Member | null>(null);
  const [rolesData, setRolesData] = useState<RolesData | null>(null);
  const [pickRole, setPickRole] = useState<string>("");
  const [pickRemoveRole, setPickRemoveRole] = useState<string>("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  useEffect(() => {
    fetch("/api/staff/roles")
      .then((r) => r.json())
      .then(setRolesData)
      .catch(() => setRolesData(null));
  }, []);

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

  const onQueryChange = (value: string) => {
    setQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    searchTimeout.current = setTimeout(() => search(value.trim()), 250);
  };

  const manageableSet = new Set((rolesData?.manageable ?? []).map((r) => r.id));

  const roleName = (id: string): string => rolesData?.roleNames[id] || id;

  const memberRoles = (m: Member): { id: string; name: string; removable: boolean }[] =>
    m.roles.map((id) => ({ id, name: roleName(id), removable: manageableSet.has(id) }));

  const pickTarget = (m: Member) => {
    setSelected(m);
    setPickRole("");
    setPickRemoveRole("");
    setReason("");
    setResult(null);
  };

  const runMutation = async (body: { targetId: string; targetName: string; roleId: string; action: "add" | "remove"; reason: string }) => {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/staff/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        const verb = body.action === "add" ? "granted" : "removed";
        setResult({ success: true, message: `${data.roleName} ${verb} for ${body.targetName}.` });
        if (selected) {
          const updated =
            body.action === "add"
              ? { ...selected, roles: [...selected.roles, body.roleId] }
              : { ...selected, roles: selected.roles.filter((id) => id !== body.roleId) };
          setSelected(updated);
          search(query);
        }
        setPickRole("");
        setPickRemoveRole("");
        setReason("");
      } else {
        setResult({ success: false, message: data.error || "Failed" });
      }
    } catch {
      setResult({ success: false, message: "Network error" });
    } finally {
      setBusy(false);
    }
  };

  const grant = () => {
    if (!selected || !pickRole) return;
    runMutation({
      targetId: selected.userId,
      targetName: selected.username,
      roleId: pickRole,
      action: "add",
      reason,
    });
  };

  const grantable = rolesData?.manageable ?? [];

  const removableRoles = selected
    ? selected.roles.filter((id) => manageableSet.has(id)).map((id) => ({ id, name: roleName(id) }))
    : [];

  const removeSelected = () => {
    if (!selected || !pickRemoveRole) return;
    const roleToRemove = removableRoles.find((r) => r.id === pickRemoveRole);
    if (!roleToRemove) return;
    if (!window.confirm(`Remove "${roleToRemove.name}" from ${selected.username}?`)) return;
    runMutation({
      targetId: selected.userId,
      targetName: selected.username,
      roleId: roleToRemove.id,
      action: "remove",
      reason,
    });
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
          <span className="text-white text-sm">Role Manager</span>
        </div>
        <h1 className="font-display text-2xl tracking-wider text-white">Role Manager</h1>
        <p className="text-text-muted text-xs mt-1.5">
          {rolesData?.actorHighest
            ? `You can manage roles below "${rolesData.actorHighest.name}".`
            : "Loading your permissions..."}
        </p>
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
              onChange={(e) => onQueryChange(e.target.value)}
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
                onClick={() => pickTarget(m)}
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
                  {memberRoles(selected).map((r) => (
                    <span
                      key={r.id}
                      className={`text-[9px] px-2 py-0.5 rounded-full ${
                        r.removable ? "bg-white/[0.06] text-text-dim" : "bg-white/[0.03] text-text-muted/60"
                      }`}
                      title={r.removable ? undefined : "Above your highest role — can't be removed here"}
                    >
                      {r.name}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-text-muted/60 mt-2">
                  {memberRoles(selected).filter((r) => !r.removable).length > 0
                    ? "Dimmed roles are above your position and can't be removed."
                    : "All visible roles are manageable."}
                </p>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <h4 className="font-display text-xs tracking-[0.15em] uppercase text-crimson mb-4">Grant Role</h4>
                  {grantable.length === 0 ? (
                    <p className="text-xs text-text-muted">No manageable roles found.</p>
                  ) : (
                    <div>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                        {grantable.map((r) => {
                          const has = selected.roles.includes(r.id);
                          const active = pickRole === r.id;
                          return (
                            <button
                              key={r.id}
                              onClick={() => !has && setPickRole(active ? "" : r.id)}
                              disabled={has || busy}
                              className={`px-3 py-2 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                                has
                                  ? "opacity-30 cursor-not-allowed"
                                  : active
                                    ? "text-white"
                                    : "text-text-muted hover:text-text-dim"
                              }`}
                              style={{
                                background: active ? `${r.color}25` : "rgba(255,255,255,0.03)",
                                border: `1px solid ${active ? `${r.color}40` : "rgba(255,255,255,0.05)"}`,
                              }}
                              title={has ? "Already has this role" : r.name}
                            >
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color }} />
                              <span className="truncate">{r.name}</span>
                              {has && " ✓"}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={grant}
                        disabled={!pickRole || busy}
                        className="mt-3 w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-crimson/20 border border-crimson/30 text-crimson hover:bg-crimson/30"
                      >
                        {busy ? "Applying..." : "Grant Role"}
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem" }}>
                  <h4 className="font-display text-xs tracking-[0.15em] uppercase text-crimson mb-4">Remove Role</h4>
                  {removableRoles.length === 0 ? (
                    <p className="text-xs text-text-muted">This member has no roles you can remove.</p>
                  ) : (
                    <div>
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                        {removableRoles.map((r) => {
                          const active = pickRemoveRole === r.id;
                          return (
                            <button
                              key={r.id}
                              onClick={() => setPickRemoveRole(active ? "" : r.id)}
                              disabled={busy}
                              className={`px-3 py-2 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                                active
                                  ? "text-white bg-red-500/10 border border-red-500/30"
                                  : "text-text-muted hover:text-text-dim bg-white/[0.03] border border-white/[0.05]"
                              }`}
                              title={r.name}
                            >
                              <span className="truncate">{r.name}</span>
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={removeSelected}
                        disabled={!pickRemoveRole || busy}
                        className="mt-3 w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25"
                      >
                        {busy ? "Applying..." : "Remove Role"}
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 block">
                    Reason <span className="normal-case text-text-muted/50">(applies to grant or remove)</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Optional — explain the change..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-text-muted/30 text-sm focus:outline-none focus:border-crimson/40 resize-none"
                  />
                </div>

                {result && (
                  <p className={`text-xs text-center ${result.success ? "text-green-400" : "text-red-400"}`}>
                    {result.message}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="v2-container rounded-2xl p-8 text-center">
              <svg className="w-10 h-10 mx-auto mb-3 text-text-muted/20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-text-muted text-xs">Search for a member to view their roles and grant or remove roles.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
