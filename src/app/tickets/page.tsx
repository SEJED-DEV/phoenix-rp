"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getDiscordLoginUrl } from "@/lib/auth-client";
import { getAvailableTicketTypes, TICKET_TYPES, ROLE_IDS } from "@/lib/tickets.config";
import TicketForm from "@/components/TicketForm";
import TicketList, { type Ticket } from "@/components/TicketList";

export default function TicketsPage() {
  const { status, loading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isStaff, setIsStaff] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [discordUrl, setDiscordUrl] = useState("#");

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

  if (loading || fetching) {
    return (
      <section className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-crimson/40 border-t-crimson rounded-full animate-spin" />
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

  const userRoles: string[] = [];
  if ("isStaff" in status && status.isStaff) userRoles.push(ROLE_IDS.STAFF);
  if (status.state === "whitelisted") userRoles.push(ROLE_IDS.WHITELISTED);
  if (status.state === "needs_checkin") userRoles.push(ROLE_IDS.CHECKIN);

  const availableTypes = getAvailableTicketTypes(userRoles);

  const stats = {
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in-progress").length,
    closed: tickets.filter((t) => t.status === "closed").length,
    total: tickets.length,
  };

  return (
    <section className="relative min-h-screen">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#050507]" />
        <div className="absolute top-[-20%] left-[10%] w-[700px] h-[600px] bg-crimson/[0.04] rounded-full blur-[160px]" />
        <div className="absolute bottom-[-20%] right-[10%] w-[600px] h-[500px] bg-gold/[0.03] rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8 pb-24 sm:pb-32" style={{ paddingTop: "clamp(80px, 12vh, 140px)" }}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-5xl sm:text-7xl fire-text mb-2">
              {isStaff ? "All Tickets" : "My Tickets"}
            </h1>
            <p className="text-text-muted text-sm">
              {isStaff
                ? "Manage and respond to community tickets."
                : "Submit and track your support tickets."}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-crimson hover:bg-crimson/80 text-white text-sm font-semibold transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Ticket
          </button>
        </div>

        {(isStaff || tickets.length > 0) && (
          <div className="grid grid-cols-4 gap-2 mb-6">
            <div className="px-3 py-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <div className="text-lg font-bold text-text">{stats.total}</div>
              <div className="text-[10px] text-text-muted uppercase tracking-wider">Total</div>
            </div>
            <div className="px-3 py-2.5 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.03]">
              <div className="text-lg font-bold text-emerald-400">{stats.open}</div>
              <div className="text-[10px] text-text-muted uppercase tracking-wider">Open</div>
            </div>
            <div className="px-3 py-2.5 rounded-lg border border-amber-500/15 bg-amber-500/[0.03]">
              <div className="text-lg font-bold text-amber-400">{stats.inProgress}</div>
              <div className="text-[10px] text-text-muted uppercase tracking-wider">In Progress</div>
            </div>
            <div className="px-3 py-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <div className="text-lg font-bold text-text-muted">{stats.closed}</div>
              <div className="text-[10px] text-text-muted uppercase tracking-wider">Closed</div>
            </div>
          </div>
        )}

        <TicketList
          tickets={tickets}
          isStaff={isStaff}
        />
      </div>

      {showForm && (
        <TicketForm
          availableTypes={availableTypes.length > 0 ? availableTypes : TICKET_TYPES.filter((t) => t.openRoles.length === 0)}
          openTicketTypes={tickets.filter((t) => t.status === "open" || t.status === "in-progress").map((t) => t.type)}
          onSuccess={refreshAndClose}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="absolute bottom-0 left-0 right-0 fire-line z-20" />
    </section>
  );
}
