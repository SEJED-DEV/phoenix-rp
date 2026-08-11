"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getDiscordLoginUrl } from "@/lib/auth-client";
import { TICKET_TYPES, type TicketType } from "@/lib/tickets.config";
import TicketForm from "@/components/TicketForm";
import TicketList, { type Ticket } from "@/components/TicketList";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";

export default function TicketsPage() {
  const { status, loading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isStaff, setIsStaff] = useState(false);
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

  if (loading || fetching) {
    return (
      <section className="relative min-h-screen px-6 sm:px-8 pb-24 sm:pb-32" style={{ paddingTop: "clamp(80px, 12vh, 140px)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <Skeleton className="h-3 w-36 mb-4" />
              <Skeleton className="h-14 sm:h-16 w-56 mb-3" />
              <Skeleton className="h-4 w-44" />
            </div>
            <Skeleton className="h-12 w-40 rounded-full" />
          </div>
          <div className="tk-stats mb-8">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} className="h-16 rounded-xl" />
            ))}
          </div>
          <div className="tk-masonry">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} className="h-44 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-4 w-3/4 mb-3" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-2/3 mb-4" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
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
        <div className="absolute top-[-20%] left-[10%] w-[700px] h-[600px] bg-crimson/[0.04] rounded-full blur-[160px]" />
        <div className="absolute bottom-[-20%] right-[10%] w-[600px] h-[500px] bg-gold/[0.03] rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 pb-24 sm:pb-32" style={{ paddingTop: "clamp(80px, 12vh, 140px)" }}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="h-px w-10 bg-gradient-to-r from-crimson to-transparent" />
              <span className="font-display text-[11px] tracking-[0.35em] text-crimson uppercase">Phoenix Support</span>
            </div>
            <h1 className="font-display text-5xl sm:text-7xl fire-text mb-3">
              {isStaff ? "All Tickets" : "My Tickets"}
            </h1>
            <p className="text-text-muted text-sm max-w-md">
              {isStaff
                ? "Manage and respond to community tickets in real time."
                : "Submit and track your support tickets."}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="hero-btn-primary shrink-0"
          >
            <span className="hero-btn-inner">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Ticket
            </span>
          </button>
        </div>

        {(isStaff || tickets.length > 0) && (
          <div className="tk-stats">
            {[
              {
                key: "total",
                label: "Total",
                value: stats.total,
                color: "var(--color-crimson)",
                icon: "M3 6h18M3 12h18M3 18h12",
              },
              {
                key: "open",
                label: "Open",
                value: stats.open,
                color: "#34d399",
                icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
              },
              {
                key: "in-progress",
                label: "In Progress",
                value: stats.inProgress,
                color: "#fbbf24",
                icon: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2",
              },
              {
                key: "closed",
                label: "Closed",
                value: stats.closed,
                color: "var(--color-text-muted)",
                icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
              },
            ].map((stat, i) => {
              const pct = stats.total > 0 ? Math.round((stat.value / stats.total) * 100) : 0;
              return (
                <div
                  key={stat.key}
                  className="tk-stat"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div
                    className="tk-stat-icon"
                    style={{ color: stat.color, background: `${stat.color}14`, borderColor: `${stat.color}3D` }}
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                    </svg>
                  </div>
                  <div>
                    <div key={stat.value} className={`tk-stat-num stat-bump`} style={{ color: stat.color }}>
                      {stat.value}
                    </div>
                    <div className="tk-stat-label">{stat.label}</div>
                  </div>
                  <div className="tk-stat-bar">
                    <span style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <TicketList
          tickets={tickets}
          isStaff={isStaff}
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

      <div className="absolute bottom-0 left-0 right-0 fire-line z-20" />
    </section>
  );
}
