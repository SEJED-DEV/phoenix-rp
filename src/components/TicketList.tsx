"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TICKET_TYPES, getTicketTypeStyle } from "@/lib/tickets.config";

export interface Ticket {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  type: string;
  subject: string;
  description: string;
  status: "open" | "in-progress" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo: string | null;
  assignedToUsername: string | null;
  userRole: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TicketListProps {
  tickets: Ticket[];
  isStaff: boolean;
}

const PAGE_SIZE = 12;

const SEGMENTS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "in-progress", label: "In Progress" },
  { key: "closed", label: "Closed" },
];

const STATUS_META: Record<string, { label: string; dot: string; badge: string }> = {
  open: {
    label: "Open",
    dot: "bg-emerald-400",
    badge: "bg-emerald-500/[0.08] text-emerald-400 border-emerald-500/25",
  },
  "in-progress": {
    label: "In Progress",
    dot: "bg-amber-400",
    badge: "bg-amber-500/[0.08] text-amber-400 border-amber-500/25",
  },
  closed: {
    label: "Closed",
    dot: "bg-white/25",
    badge: "bg-white/[0.04] text-text-muted border-white/[0.08]",
  },
};

const PRIORITY_META: Record<string, { label: string; dot: string; pill: string; glow: string }> = {
  urgent: {
    label: "Urgent",
    dot: "bg-red-400",
    pill: "text-red-400 border-red-500/30 bg-red-500/[0.08]",
    glow: "tk-pri-urgent",
  },
  high: {
    label: "High",
    dot: "bg-orange-400",
    pill: "text-orange-400 border-orange-500/30 bg-orange-500/[0.08]",
    glow: "tk-pri-high",
  },
  medium: {
    label: "Medium",
    dot: "bg-blue-400",
    pill: "text-blue-400 border-blue-500/30 bg-blue-500/[0.08]",
    glow: "tk-pri-medium",
  },
  low: {
    label: "Low",
    dot: "bg-slate-400",
    pill: "text-slate-400 border-slate-500/30 bg-slate-500/[0.08]",
    glow: "tk-pri-low",
  },
};

const ROLE_BADGE: Record<string, string> = {
  Staff: "bg-crimson/15 text-crimson border-crimson/30",
  Whitelisted: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  "🔑 | Whitelisted S2": "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  "Check-in": "bg-amber-500/10 text-amber-400 border-amber-500/25",
};

export default function TicketList({ tickets, isStaff }: TicketListProps) {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortNewest, setSortNewest] = useState(true);

  const knownIds = useRef<Set<string>>(new Set());
  const currentIds = useMemo(() => new Set(tickets.map((t) => t.id)), [tickets]);

  const filtered = useMemo(() => {
    let result = tickets.filter((t) => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterType !== "all" && t.type !== filterType) return false;
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      if (search) {
        const q = search.toLowerCase();
        const match =
          t.subject.toLowerCase().includes(q) ||
          t.username.toLowerCase().includes(q) ||
          t.id.slice(0, 8).toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
    result.sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sortNewest ? db - da : da - db;
    });
    return result;
  }, [tickets, filterStatus, filterType, filterPriority, search, sortNewest]);

  const segmentCounts = useMemo(
    () => ({
      open: filtered.filter((t) => t.status === "open").length,
      inProgress: filtered.filter((t) => t.status === "in-progress").length,
      closed: filtered.filter((t) => t.status === "closed").length,
    }),
    [filtered],
  );

  useEffect(() => {
    knownIds.current = currentIds;
  }, [currentIds]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetPage = () => setPage(1);

  const hasFilters =
    search !== "" || filterStatus !== "all" || filterType !== "all" || filterPriority !== "all";

  const clearFilters = () => {
    setSearch("");
    setFilterStatus("all");
    setFilterType("all");
    setFilterPriority("all");
    setPage(1);
  };

  return (
    <div>
      {/* Search */}
      <div className="relative max-w-xl mb-4">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); resetPage(); }}
          placeholder="Search tickets by subject, user, or ID..."
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] text-text text-sm placeholder:text-text-muted/40 focus:outline-none focus:border-crimson/40 focus:bg-white/[0.03] transition-colors"
        />
        {search && (
          <button
            onClick={() => { setSearch(""); resetPage(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="tk-seg">
          {SEGMENTS.map((s) => (
            <button
              key={s.key}
              onClick={() => { setFilterStatus(s.key); resetPage(); }}
              className={`tk-seg-item ${filterStatus === s.key ? "active" : ""}`}
            >
              {s.label}
              {s.key === "open" && <span className="tk-seg-count">{segmentCounts.open}</span>}
              {s.key === "in-progress" && <span className="tk-seg-count">{segmentCounts.inProgress}</span>}
              {s.key === "closed" && <span className="tk-seg-count">{segmentCounts.closed}</span>}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); resetPage(); }}
            className="px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02] text-text text-xs focus:outline-none focus:border-crimson/40"
          >
            <option value="all">All Types</option>
            {TICKET_TYPES.map((t) => (
              <option key={t.slug} value={t.slug}>{t.name}</option>
            ))}
          </select>
          {isStaff && (
            <select
              value={filterPriority}
              onChange={(e) => { setFilterPriority(e.target.value); resetPage(); }}
              className="px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02] text-text text-xs focus:outline-none focus:border-crimson/40"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          )}
          {isStaff && (
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.04] text-[10px] font-semibold uppercase tracking-wider text-emerald-400/90">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 tk-dot-pulse" />
              Live
            </span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] text-text-muted">{filtered.length} ticket{filtered.length !== 1 ? "s" : ""}</span>
          <button
            onClick={() => setSortNewest(!sortNewest)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02] text-text-muted text-xs hover:text-text hover:border-white/[0.12] transition-colors"
          >
            <svg className={`w-3.5 h-3.5 transition-transform ${sortNewest ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            {sortNewest ? "Newest" : "Oldest"}
          </button>
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="inline-flex items-center gap-1.5 mb-6 text-[11px] text-text-muted hover:text-crimson transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear filters
        </button>
      )}

      {/* Ticket grid */}
      {paginated.length === 0 ? (
        <div className="tk-empty">
          <div className="tk-empty-icon">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3>{search || hasFilters ? "No matching tickets" : isStaff ? "No tickets yet" : "You have no tickets"}</h3>
          <p>
            {search || hasFilters
              ? "Try adjusting your search or filters to find what you're looking for."
              : isStaff
                ? "When community members open tickets, they'll appear here in real time."
                : "Open a ticket and it will show up here so you can track its progress."}
          </p>
        </div>
      ) : (
        <div className="tk-masonry">
          {paginated.map((ticket, i) => {
            const typeInfo = TICKET_TYPES.find((t) => t.slug === ticket.type);
            const typeStyle = typeInfo ? getTicketTypeStyle(typeInfo) : null;
            const status = STATUS_META[ticket.status] || STATUS_META.open;
            const pri = PRIORITY_META[ticket.priority] || PRIORITY_META.medium;
            const isNew = !knownIds.current.has(ticket.id);
            const date = new Date(ticket.createdAt);
            const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
            const initial = (ticket.username || "?").charAt(0).toUpperCase();

            return (
              <div
                key={ticket.id}
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/tickets/${ticket.id}`)}
                onKeyDown={(e) => { if (e.key === "Enter") router.push(`/tickets/${ticket.id}`); }}
                className={`tk-card group ${pri.glow} ${isNew ? "tk-new" : ""}`}
                style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
              >
                <span className="tk-card-accent" style={typeStyle ? { background: typeStyle.color } : undefined} />

                {/* Header: type + priority */}
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
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border whitespace-nowrap ${pri.pill}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${pri.dot} ${ticket.priority === "urgent" ? "tk-dot-pulse-red" : ""}`} />
                    {pri.label}
                  </span>
                </div>

                {/* Subject + assignment */}
                <div>
                  <h3 className="tk-subject group-hover:text-crimson">{ticket.subject}</h3>
                  {isStaff && ticket.assignedToUsername && (
                    <span className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] text-text-muted/60">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Assigned to @{ticket.assignedToUsername}
                    </span>
                  )}
                </div>

                {/* Description excerpt */}
                <p className="tk-desc line-clamp-2">{ticket.description}</p>

                {/* Meta: user + status */}
                <div className="tk-meta">
                  <div className="flex items-center gap-2 min-w-0">
                    {ticket.avatar ? (
                      <img src={ticket.avatar} alt="" className="w-5 h-5 rounded-full shrink-0" loading="lazy" />
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-white/10 text-text-dim text-[9px] font-bold flex items-center justify-center shrink-0">
                        {initial}
                      </span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/profile/${ticket.userId}`); }}
                      className="tk-user truncate"
                    >
                      @{ticket.username}
                    </button>
                    {ticket.userRole && ROLE_BADGE[ticket.userRole] && (
                      <span className={`hidden sm:inline-flex text-[8px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${ROLE_BADGE[ticket.userRole]}`}>
                        {ticket.userRole}
                      </span>
                    )}
                  </div>
                  <span className={`tk-badge shrink-0 ${status.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${ticket.status === "open" ? "tk-dot-pulse" : ""}`} />
                    {status.label}
                  </span>
                </div>

                {/* Footer: id + date / arrow */}
                <div className="tk-footer">
                  <span className="tk-id">
                    <span className="tk-id-hash">#</span>
                    {ticket.id.slice(0, 8)}
                    <span className="tk-date"> · {dateStr} {timeStr}</span>
                  </span>
                  <span className="tk-arrow">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
                    </svg>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-text-muted">
            Page {safePage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={safePage === 1}
              className="px-2.5 py-1.5 rounded-lg border border-white/[0.06] text-xs text-text-muted hover:text-text hover:border-white/[0.12] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="px-2.5 py-1.5 rounded-lg border border-white/[0.06] text-xs text-text-muted hover:text-text hover:border-white/[0.12] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (safePage <= 3) {
                pageNum = i + 1;
              } else if (safePage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = safePage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    safePage === pageNum
                      ? "bg-crimson/20 border border-crimson/40 text-crimson"
                      : "border border-white/[0.06] text-text-muted hover:text-text hover:border-white/[0.12]"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-white/[0.06] text-xs text-text-muted hover:text-text hover:border-white/[0.12] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={safePage === totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-white/[0.06] text-xs text-text-muted hover:text-text hover:border-white/[0.12] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
