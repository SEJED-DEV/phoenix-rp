"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getDiscordLoginUrl } from "@/lib/auth-client";
import { TICKET_TYPES, getTicketTypeStyle } from "@/lib/tickets.config";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";
import type { Ticket } from "@/components/TicketList";

export default function TicketArchivePage() {
  const { status, loading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [fetching, setFetching] = useState(true);
  const [denied, setDenied] = useState(false);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [purgeTarget, setPurgeTarget] = useState<Ticket | null>(null);
  const [purgeError, setPurgeError] = useState("");

  const discordUrl = useMemo(() => getDiscordLoginUrl(), []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const flash = (type: "success" | "error", text: string) => setToast({ type, text });

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/tickets?archived=1");
      if (!res.ok) {
        if (res.status === 403) setDenied(true);
        return;
      }
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch {
      flash("error", "Failed to load the archive.");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && status.state !== "logged_out") {
      fetchTickets(); // eslint-disable-line react-hooks/set-state-in-effect
    } else if (!loading) {
      setFetching(false);
    }
  }, [loading, status, fetchTickets]);

  const restoreTicket = async (id: string) => {
    if (busyId) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/tickets/${id}/restore`, { method: "POST" });
      if (res.ok) {
        setTickets((ts) => ts.filter((t) => t.id !== id));
        flash("success", "Ticket restored to the active list.");
      } else {
        const j = await res.json().catch(() => ({}));
        flash("error", j.error || "Failed to restore ticket.");
      }
    } catch {
      flash("error", "Failed to restore ticket.");
    } finally {
      setBusyId(null);
    }
  };

  const confirmPurge = async (reason?: string) => {
    if (!purgeTarget || busyId) return;
    setBusyId(purgeTarget.id);
    setPurgeError("");
    try {
      const res = await fetch(`/api/tickets/${purgeTarget.id}/purge`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        const id = purgeTarget.id;
        setPurgeTarget(null);
        setTickets((ts) => ts.filter((t) => t.id !== id));
        flash("success", "Ticket permanently purged.");
      } else {
        const j = await res.json().catch(() => ({}));
        setPurgeError(j.error || "Failed to purge ticket.");
      }
    } catch {
      setPurgeError("Failed to purge ticket.");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter(
      (t) =>
        t.subject.toLowerCase().includes(q) ||
        t.username.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
    );
  }, [tickets, search]);

  if (loading || fetching) {
    return (
      <section className="relative min-h-screen px-6 sm:px-8 pb-24 sm:pb-32" style={{ paddingTop: "clamp(80px, 12vh, 140px)" }}>
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-3 w-36 mb-4" />
          <Skeleton className="h-14 sm:h-16 w-56 mb-8" />
          <div className="tk-grid">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} className="h-40 rounded-2xl p-5">
                <Skeleton className="h-3 w-28 mb-3" />
                <Skeleton className="h-4 w-3/4 mb-3" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </SkeletonCard>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (status.state === "logged_out") {
    return (
      <section className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-display text-4xl fire-text mb-4">Login Required</h1>
          <p className="text-text-muted mb-6">You need to login with Discord to access the archive.</p>
          <a href={discordUrl} className="px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] rounded-xl text-white font-semibold transition-colors">
            Login with Discord
          </a>
        </div>
      </section>
    );
  }

  if (denied) {
    return (
      <section className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-display text-4xl fire-text mb-4">Access Denied</h1>
          <p className="text-text-muted mb-6">The ticket archive is restricted to authorized staff.</p>
          <Link href="/tickets" className="px-6 py-3 rounded-xl text-xs font-medium text-text-muted border border-white/[0.08] hover:text-white hover:border-white/20 transition-colors">
            Back to Tickets
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[var(--color-bg)]" />
        <div className="absolute top-[-20%] left-[10%] w-[700px] h-[600px] bg-crimson/[0.04] rounded-full blur-[160px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 pb-24 sm:pb-32" style={{ paddingTop: "clamp(80px, 12vh, 140px)" }}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Link href="/tickets" className="inline-flex items-center gap-1.5 text-[11px] text-text-muted hover:text-white transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Tickets
              </Link>
              <span className="h-px w-8 bg-gradient-to-r from-crimson to-transparent" />
              <span className="font-display text-[11px] tracking-[0.35em] text-crimson uppercase">Restricted</span>
            </div>
            <h1 className="font-display text-5xl sm:text-7xl fire-text mb-3">Archive</h1>
            <p className="text-text-muted text-sm max-w-md">
              Archived tickets keep their full transcript and attachments. Restore them to the active list or permanently purge them.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.02] text-[10px] font-semibold uppercase tracking-wider text-text-muted shrink-0">
            {filtered.length} archived
          </span>
        </div>

        {toast && (
          <div
            className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg text-xs shadow-lg border ${
              toast.type === "success"
                ? "text-[#34d399] border-[#34d399]/25 bg-[#34d399]/10"
                : "text-[#f87171] border-[#f87171]/25 bg-[#f87171]/10"
            }`}
          >
            {toast.text}
          </div>
        )}

        <div className="relative max-w-xl mb-6">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search archived tickets by subject, user, or ID..."
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] text-text text-sm placeholder:text-text-muted/40 focus:outline-none focus:border-crimson/40 focus:bg-white/[0.03] transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="tk-empty">
            <div className="tk-empty-icon">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            <h3>{search ? "No matching archived tickets" : "Archive is empty"}</h3>
            <p>{search ? "Try adjusting your search." : "When tickets are archived, they'll appear here with their transcripts."}</p>
          </div>
        ) : (
          <div className="tk-grid">
            {filtered.map((ticket) => {
              const typeInfo = TICKET_TYPES.find((t) => t.slug === ticket.type);
              const typeStyle = typeInfo ? getTicketTypeStyle(typeInfo) : null;
              const archivedDate = ticket.archivedAt
                ? new Date(ticket.archivedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "";
              return (
                <div key={ticket.id} className="tk-card group" style={{ borderColor: "color-mix(in srgb, var(--color-gold) 18%, transparent)" }}>
                  <span className="tk-card-accent" style={{ background: typeStyle ? typeStyle.color : undefined }} />
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {typeInfo && typeStyle && (
                        <span className="tk-type-icon" style={{ color: typeStyle.color, background: typeStyle.bg, borderColor: typeStyle.border }}>
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={typeInfo.icon} />
                          </svg>
                        </span>
                      )}
                      <span className="tk-type-name truncate" style={typeStyle ? { color: typeStyle.color } : undefined}>
                        {typeInfo ? typeInfo.name : ticket.type}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-white/[0.08] bg-white/[0.03] text-text-muted whitespace-nowrap">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                      </svg>
                      Archived
                    </span>
                  </div>

                  <div>
                    <h3 className="tk-subject">{ticket.subject}</h3>
                    <span className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] text-text-muted/60">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      @{ticket.username} · archived {archivedDate}
                    </span>
                  </div>

                  <p className="tk-desc line-clamp-2">{ticket.description}</p>

                  <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-white/[0.05]">
                    <span className="tk-id">
                      <span className="tk-id-hash">#</span>
                      {ticket.id.slice(0, 8)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/tickets/${ticket.id}`)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-text-muted border border-white/[0.08] hover:text-white hover:border-white/20 transition-colors"
                      >
                        Transcript
                      </button>
                      <button
                        onClick={() => restoreTicket(ticket.id)}
                        disabled={busyId === ticket.id}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-emerald-400 border border-emerald-500/25 bg-emerald-500/[0.05] hover:bg-emerald-500/[0.12] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {busyId === ticket.id ? "Restoring…" : "Restore"}
                      </button>
                      <button
                        onClick={() => { setPurgeTarget(ticket); setPurgeError(""); }}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-red-400 border border-red-500/25 bg-red-500/[0.05] hover:bg-red-500/[0.12] transition-colors"
                      >
                        Purge
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!purgeTarget}
        title="Permanently purge this ticket?"
        message={
          purgeTarget
            ? `"${purgeTarget.subject}" and its entire transcript and attachments will be permanently deleted. This cannot be undone.`
            : ""
        }
        confirmLabel="Purge Forever"
        danger
        busy={busyId !== null}
        error={purgeError}
        showReason
        onConfirm={confirmPurge}
        onCancel={() => setPurgeTarget(null)}
      />
    </section>
  );
}
