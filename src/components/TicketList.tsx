"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { TICKET_TYPES } from "@/lib/tickets.config";

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

const PAGE_SIZE = 20;

const STATUS_STYLES: Record<string, { dot: string; bg: string; text: string; border: string; label: string }> = {
  open: { dot: "bg-emerald-400", bg: "bg-emerald-500/[0.06]", text: "text-emerald-400", border: "border-emerald-500/20", label: "Open" },
  "in-progress": { dot: "bg-amber-400", bg: "bg-amber-500/[0.06]", text: "text-amber-400", border: "border-amber-500/20", label: "In Progress" },
  closed: { dot: "bg-white/20", bg: "bg-white/[0.02]", text: "text-text-muted", border: "border-white/[0.06]", label: "Closed" },
};

const PRIORITY_STYLES: Record<string, { dot: string; label: string }> = {
  low: { dot: "bg-slate-400", label: "Low" },
  medium: { dot: "bg-blue-400", label: "Med" },
  high: { dot: "bg-orange-400", label: "High" },
  urgent: { dot: "bg-red-400", label: "Urgent" },
};

const ROLE_BADGE: Record<string, string> = {
  Staff: "bg-crimson/15 text-crimson border-crimson/30",
  Whitelisted: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset page when filters change
  const resetPage = () => setPage(1);

  return (
    <div>
      {/* Search + Filters */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            placeholder="Search tickets by subject, user, or ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-text text-sm placeholder:text-text-muted/40 focus:outline-none focus:border-crimson/40 transition-colors"
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

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); resetPage(); }}
            className="px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02] text-text text-xs focus:outline-none focus:border-crimson/40"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>
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
      </div>

      {/* Ticket list */}
      {paginated.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-14 h-14 text-text-muted/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-text-muted text-sm">
            {search ? "No tickets match your search." : "No tickets found."}
          </p>
        </div>
      ) : (
        <div className="border border-white/[0.06] rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[1fr_120px_100px_90px_100px] gap-3 px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.06] text-[11px] text-text-muted uppercase tracking-wider font-semibold">
            <span>Subject</span>
            <span>Type</span>
            <span>Status</span>
            <span>Priority</span>
            <span className="text-right">Date</span>
          </div>

          {/* Rows */}
          {paginated.map((ticket, i) => {
            const typeInfo = TICKET_TYPES.find((t) => t.slug === ticket.type);
            const statusStyle = STATUS_STYLES[ticket.status] || STATUS_STYLES.open;
            const priorityStyle = PRIORITY_STYLES[ticket.priority || "medium"] || PRIORITY_STYLES.medium;
            const date = new Date(ticket.createdAt);
            const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

            return (
              <button
                key={ticket.id}
                onClick={() => router.push(`/tickets/${ticket.id}`)}
                className="ticket-row-enter w-full text-left grid grid-cols-1 sm:grid-cols-[1fr_120px_100px_90px_100px] gap-2 sm:gap-3 px-4 py-3 border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.03] transition-colors group"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {/* Subject + meta */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] text-text-muted/60 font-mono">{ticket.id.slice(0, 8)}</span>
                    {isStaff && ticket.assignedToUsername && (
                      <span className="text-[10px] text-text-muted/50">@{ticket.assignedToUsername}</span>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-text group-hover:text-crimson transition-colors truncate">
                    {ticket.subject}
                  </h3>
                  {isStaff && (
                    <span className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/profile/${ticket.userId}`); }}
                        className="text-[11px] text-text-muted/50 hover:text-crimson transition-colors"
                      >
                        @{ticket.username}
                      </button>
                      {ticket.userRole && ROLE_BADGE[ticket.userRole] && (
                        <span className={`text-[8px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${ROLE_BADGE[ticket.userRole]}`}>
                          {ticket.userRole}
                        </span>
                      )}
                    </span>
                  )}
                </div>

                {/* Type */}
                <div className="hidden sm:flex items-center gap-1.5">
                  {typeInfo && (
                    <>
                      <svg className="w-3 h-3 text-text-muted/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={typeInfo.icon} />
                      </svg>
                      <span className="text-xs text-text-muted truncate">{typeInfo.name}</span>
                    </>
                  )}
                </div>

                {/* Status */}
                <div className="hidden sm:flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusStyle.dot}`} />
                  <span className={`text-xs ${statusStyle.text}`}>{statusStyle.label}</span>
                </div>

                {/* Priority */}
                <div className="hidden sm:flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityStyle.dot}`} />
                  <span className="text-xs text-text-muted">{priorityStyle.label}</span>
                </div>

                {/* Date */}
                <div className="hidden sm:flex items-center justify-end">
                  <span className="text-[11px] text-text-muted/50">{dateStr}</span>
                </div>

                {/* Mobile row: status + priority + date */}
                <div className="flex sm:hidden items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                    <span className={`w-1 h-1 rounded-full ${statusStyle.dot}`} />
                    {statusStyle.label}
                  </span>
                  <span className="text-[10px] text-text-muted/50">{priorityStyle.label}</span>
                  {typeInfo && <span className="text-[10px] text-text-muted/40">{typeInfo.name}</span>}
                  <span className="text-[10px] text-text-muted/40 ml-auto">{dateStr}</span>
                </div>
              </button>
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
