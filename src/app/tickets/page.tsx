"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getDiscordLoginUrl } from "@/lib/auth-client";
import { TICKET_TYPES, type TicketType } from "@/lib/tickets.config";
import TicketForm from "@/components/TicketForm";
import TicketList, { type Ticket } from "@/components/TicketList";
import { Skeleton } from "@/components/Skeleton";

export default function TicketsPage() {
  const { status, loading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isStaff, setIsStaff] = useState(false);
  const [canViewArchive, setCanViewArchive] = useState(false);
  const [deletePolicy, setDeletePolicy] = useState<"staff-only" | "staff-or-owner">("staff-only");
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [discordUrl, setDiscordUrl] = useState("#");
  const [availableTypes, setAvailableTypes] = useState<TicketType[]>(
    TICKET_TYPES.filter((t) => t.openRoles.length === 0)
  );

  useEffect(() => {
    setDiscordUrl(getDiscordLoginUrl());
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/tickets");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        setIsStaff(data.isStaff || false);
        if (data.canViewArchive) setCanViewArchive(data.canViewArchive);
        if (data.deletePolicy) setDeletePolicy(data.deletePolicy);
        if (data.availableTypes) setAvailableTypes(data.availableTypes);
      }
    } catch {
      console.error("Failed to fetch tickets");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && status.state !== "logged_out") {
      fetchTickets();
    } else if (!loading) {
      setFetching(false);
    }
  }, [loading, status, fetchTickets]);

  // Poll for new tickets every 5s
  useEffect(() => {
    if (loading || status.state === "logged_out") return;
    const interval = setInterval(fetchTickets, 5000);
    return () => clearInterval(interval);
  }, [loading, status, fetchTickets]);

  const refreshAndClose = () => {
    setShowForm(false);
    fetchTickets();
  };

  const userId = "user" in status ? status.user?.id : null;

  if (loading || fetching) {
    return (
      <section className="relative min-h-screen px-6 pb-20" style={{ paddingTop: "clamp(80px, 12vh, 140px)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <Skeleton className="h-3 w-36 mb-5" />
            <Skeleton className="h-14 w-48 mb-3" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
          <div className="space-y-1">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
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
          <p className="text-text-muted mb-6">You need to login with Discord to access tickets.</p>
          <a href={discordUrl} className="px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] rounded-xl text-white font-semibold transition-colors">
            Login with Discord
          </a>
        </div>
      </section>
    );
  }

  const stats = {
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in-progress").length,
    closed: tickets.filter((t) => t.status === "closed").length,
    total: tickets.length,
  };

  return (
    <section className="relative min-h-screen">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[var(--color-bg)]" />
        <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[1000px] h-[700px] rounded-full blur-[250px] opacity-[0.03]" style={{ background: "#a78bfa" }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pb-20" style={{ paddingTop: "clamp(80px, 12vh, 140px)" }}>
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 max-w-[60px]" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12))" }} />
            <span className="text-[9px] tracking-[0.5em] uppercase text-white/20 font-display">Support</span>
            <div className="h-px flex-1 max-w-[60px]" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.12), transparent)" }} />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-5xl sm:text-7xl tracking-tight text-white mb-3">
                {isStaff ? "Tickets" : "My Tickets"}
              </h1>
              <p className="text-white/25 text-sm max-w-md">
                {isStaff ? "Manage and respond to community support requests." : "Submit and track your support tickets."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {canViewArchive && (
                <a href="/tickets/archive" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[11px] font-medium text-white/30 border border-white/[0.06] hover:text-white/60 hover:border-white/[0.12] transition-all">
                  Archive
                </a>
              )}
              <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[11px] font-medium text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition-all">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" /></svg>
                New Ticket
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        {(isStaff || tickets.length > 0) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
            {[
              { label: "Total", value: stats.total, color: "#a78bfa" },
              { label: "Open", value: stats.open, color: "#34d399" },
              { label: "In Progress", value: stats.inProgress, color: "#fbbf24" },
              { label: "Closed", value: stats.closed, color: "rgba(255,255,255,0.25)" },
            ].map((s) => (
              <div key={s.label} className="px-4 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <p className="font-display text-2xl text-white">{s.value}</p>
                <p className="text-[10px] text-white/20 uppercase tracking-[0.15em] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <TicketList
          tickets={tickets}
          isStaff={isStaff}
          userId={userId}
          deletePolicy={deletePolicy}
          onDeleted={() => fetchTickets()}
        />
      </div>

      {showForm && (
        <TicketForm
          availableTypes={availableTypes}
          openTicketTypes={tickets.filter((t) => t.status === "open" || t.status === "in-progress").map((t) => t.type)}
          onSuccess={refreshAndClose}
          onCancel={() => setShowForm(false)}
        />
      )}
    </section>
  );
}
