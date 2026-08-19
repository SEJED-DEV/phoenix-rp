"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TICKET_TYPES, getTicketTypeStyle } from "@/lib/tickets.config";
import ConfirmDialog from "@/components/ConfirmDialog";

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
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TicketListProps {
  tickets: Ticket[];
  isStaff: boolean;
  userId?: string | null;
  deletePolicy?: "staff-only" | "staff-or-owner";
  onDeleted?: (ticketId: string) => void;
}

const PAGE_SIZE = 20;

const STATUS_META: Record<string, { label: string; dot: string; color: string }> = {
  open: { label: "Open", dot: "bg-emerald-400", color: "text-emerald-400" },
  "in-progress": { label: "In Progress", dot: "bg-amber-400", color: "text-amber-400" },
  closed: { label: "Closed", dot: "bg-white/25", color: "text-white/25" },
};

const PRIORITY_META: Record<string, { label: string; color: string }> = {
  urgent: { label: "Urgent", color: "text-red-400" },
  high: { label: "High", color: "text-orange-400" },
  medium: { label: "Med", color: "text-blue-400" },
  low: { label: "Low", color: "text-white/25" },
};

export default function TicketList({
  tickets,
  isStaff,
  userId,
  deletePolicy = "staff-only",
  onDeleted,
}: TicketListProps) {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortNewest, setSortNewest] = useState(true);

  const [pendingDelete, setPendingDelete] = useState<Ticket | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const knownIds = useRef<Set<string>>(new Set());
  const currentIds = useMemo(() => new Set(tickets.map((t) => t.id)), [tickets]);

  const filtered = useMemo(() => {
    let result = tickets.filter((t) => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterType !== "all" && t.type !== filterType) return false;
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
  }, [tickets, filterStatus, filterType, search, sortNewest]);

  const segmentCounts = useMemo(
    () => ({
      open: tickets.filter((t) => t.status === "open").length,
      inProgress: tickets.filter((t) => t.status === "in-progress").length,
      closed: tickets.filter((t) => t.status === "closed").length,
    }),
    [tickets],
  );

  useEffect(() => {
    knownIds.current = currentIds;
  }, [currentIds]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetPage = () => setPage(1);

  const hasFilters = search !== "" || filterStatus !== "all" || filterType !== "all";

  const canDelete = (t: Ticket) =>
    isStaff || (deletePolicy === "staff-or-owner" && !!userId && t.userId === userId);

  const handleDelete = async (reason?: string) => {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/tickets/${pendingDelete.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        const id = pendingDelete.id;
        setPendingDelete(null);
        onDeleted?.(id);
      } else {
        const data = await res.json().catch(() => null);
        setDeleteError(data?.error || "Failed to delete ticket.");
      }
    } catch {
      setDeleteError("Failed to delete ticket.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            placeholder="Search tickets..."
            className="w-full pl-10 pr-8 py-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-crimson/40 transition-colors"
          />
          {search && (
            <button onClick={() => { setSearch(""); resetPage(); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(["all", "open", "in-progress", "closed"] as const).map((s) => {
            const count = s === "all" ? tickets.length : segmentCounts[s === "in-progress" ? "inProgress" : s];
            const isActive = filterStatus === s;
            const sc = s !== "all" ? STATUS_META[s] : null;
            return (
              <button
                key={s}
                onClick={() => { setFilterStatus(s); resetPage(); }}
                className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap"
                style={{
                  background: isActive ? (s === "all" ? "rgba(255,255,255,0.08)" : `${STATUS_META[s === "in-progress" ? "in-progress" : s]?.color === "text-emerald-400" ? "#34d399" : STATUS_META[s === "in-progress" ? "in-progress" : s]?.color === "text-amber-400" ? "#fbbf24" : "#666"}10`) : "transparent",
                  border: `1px solid ${isActive ? "rgba(255,255,255,0.1)" : "transparent"}`,
                  color: isActive ? "#fff" : "rgba(255,255,255,0.3)",
                }}
              >
                {s === "all" ? "All" : STATUS_META[s]?.label}
                <span className="ml-1.5 text-[9px] opacity-50">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); resetPage(); }}
            className="px-2.5 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] text-white/40 text-[11px] focus:outline-none focus:border-crimson/40"
          >
            <option value="all">All Types</option>
            {TICKET_TYPES.map((t) => (
              <option key={t.slug} value={t.slug}>{t.name}</option>
            ))}
          </select>
          <button
            onClick={() => setSortNewest(!sortNewest)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] text-white/30 text-[11px] hover:text-white/60 hover:border-white/[0.12] transition-colors"
          >
            <svg className={`w-3 h-3 transition-transform ${sortNewest ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            {sortNewest ? "Newest" : "Oldest"}
          </button>
        </div>
      </div>

      {hasFilters && (
        <button onClick={() => { setSearch(""); setFilterStatus("all"); setFilterType("all"); setPage(1); }} className="inline-flex items-center gap-1 mb-4 text-[10px] text-white/20 hover:text-crimson transition-colors">
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          Clear filters
        </button>
      )}

      {/* Ticket list */}
      {paginated.length === 0 ? (
        <div className="text-center py-24 rounded-xl" style={{ background: "rgba(255,255,255,0.015)", border: "1px dashed rgba(255,255,255,0.05)" }}>
          <p className="text-white/15 text-xs tracking-[0.3em] uppercase font-display">
            {search || hasFilters ? "No matching tickets" : isStaff ? "No tickets yet" : "You have no tickets"}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {paginated.map((ticket, i) => {
            const typeInfo = TICKET_TYPES.find((t) => t.slug === ticket.type);
            const typeStyle = typeInfo ? getTicketTypeStyle(typeInfo) : null;
            const status = STATUS_META[ticket.status] || STATUS_META.open;
            const pri = PRIORITY_META[ticket.priority] || PRIORITY_META.medium;
            const isNew = !knownIds.current.has(ticket.id);
            const date = new Date(ticket.createdAt);
            const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

            return (
              <div
                key={ticket.id}
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/tickets/${ticket.id}`)}
                onKeyDown={(e) => { if (e.key === "Enter") router.push(`/tickets/${ticket.id}`); }}
                className={`group flex items-center gap-4 px-4 py-3 rounded-xl bg-white/[0.02] transition-all duration-200 hover:bg-white/[0.04] hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.015)] cursor-pointer ${isNew ? "animate-[fadeIn_0.3s_ease]" : ""}`}
              >
                {/* Type dot */}
                <div className="shrink-0">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: typeStyle ? typeStyle.bg : "rgba(255,255,255,0.04)", border: `1px solid ${typeStyle ? typeStyle.border : "rgba(255,255,255,0.06)"}` }}>
                    {typeInfo && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: typeStyle?.color }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={typeInfo.icon} />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-0.5">
                    <span className="text-sm text-white/90 font-medium truncate group-hover:text-white transition-colors">{ticket.subject}</span>
                    <span className={`text-[9px] font-semibold ${status.color}`}>{status.label}</span>
                    {ticket.priority !== "medium" && (
                      <span className={`text-[9px] font-medium ${pri.color}`}>{pri.label}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-white/20">
                    <span style={{ color: typeStyle?.color }} className="opacity-60">{typeInfo?.name || ticket.type}</span>
                    <span className="text-white/8">·</span>
                    <span>@{ticket.username}</span>
                    {isStaff && ticket.assignedToUsername && (
                      <>
                        <span className="text-white/8">·</span>
                        <span className="text-white/25">→ @{ticket.assignedToUsername}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right side */}
                <div className="hidden sm:flex items-center gap-3 shrink-0">
                  <span className="text-[10px] text-white/15">{dateStr} {timeStr}</span>
                  {canDelete(ticket) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setPendingDelete(ticket); setDeleteError(""); }}
                      aria-label="Archive ticket"
                      className="w-6 h-6 rounded flex items-center justify-center text-white/10 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                      </svg>
                    </button>
                  )}
                  <svg className="w-3.5 h-3.5 text-white/10 group-hover:text-white/25 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <span className="text-[11px] text-white/15">
            {filtered.length} ticket{filtered.length !== 1 ? "s" : ""} · Page {safePage}/{totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={safePage === 1} className="px-2 py-1 rounded text-[11px] text-white/25 hover:text-white/50 disabled:opacity-20 transition-colors">&laquo;</button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} className="px-2 py-1 rounded text-[11px] text-white/25 hover:text-white/50 disabled:opacity-20 transition-colors">&lsaquo;</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i + 1;
              else if (safePage <= 3) pageNum = i + 1;
              else if (safePage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = safePage - 2 + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-7 h-7 rounded text-[11px] transition-colors ${
                    safePage === pageNum
                      ? "bg-crimson/20 text-crimson"
                      : "text-white/25 hover:text-white/50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="px-2 py-1 rounded text-[11px] text-white/25 hover:text-white/50 disabled:opacity-20 transition-colors">&rsaquo;</button>
            <button onClick={() => setPage(totalPages)} disabled={safePage === totalPages} className="px-2 py-1 rounded text-[11px] text-white/25 hover:text-white/50 disabled:opacity-20 transition-colors">&raquo;</button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Archive this ticket?"
        message={
          pendingDelete
            ? `"${pendingDelete.subject}" will be moved to the archive with its full transcript preserved. Only authorized staff can view or restore it later.`
            : ""
        }
        confirmLabel="Archive Ticket"
        danger
        busy={deleting}
        error={deleteError}
        showReason={isStaff}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
