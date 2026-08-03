"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getDiscordLoginUrl } from "@/lib/auth-client";
import { TICKET_TYPES, getTicketTypeStyle } from "@/lib/tickets.config";
import type { Ticket } from "@/components/TicketList";
import { Skeleton } from "@/components/Skeleton";

interface TicketMessage {
  id: string;
  ticketId: string;
  userId: string;
  username: string;
  avatar: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_OPTIONS = [
  { value: "open", label: "Open", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25" },
  { value: "in-progress", label: "In Progress", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/25" },
  { value: "closed", label: "Closed", color: "text-text-muted", bg: "bg-white/[0.03]", border: "border-white/[0.08]" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "text-slate-400" },
  { value: "medium", label: "Med", color: "text-blue-400" },
  { value: "high", label: "High", color: "text-orange-400" },
  { value: "urgent", label: "Urgent", color: "text-red-400" },
];

const ROLE_BADGES: Record<string, string> = {
  Staff: "bg-crimson/15 text-crimson border-crimson/30",
  Whitelisted: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  "Check-in": "bg-amber-500/10 text-amber-400 border-amber-500/25",
};

function formatMsgTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatFullDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    weekday: "short", month: "long", day: "numeric", year: "numeric",
  });
}

function sameDay(a: string, b: string) {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { status, loading: authLoading } = useAuth();
  const id = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [flash, setFlash] = useState(false);
  const [jumpedToLatest, setJumpedToLatest] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollBottomRef = useRef(false);

  const isLoggedIn = !authLoading && status.state !== "logged_out";
  const isStaff = "isStaff" in status && status.isStaff;
  const user = "user" in status ? status.user : null;
  const discordUrl = getDiscordLoginUrl();

  const fetchTicket = useCallback(async (page = 1, scrollToBottom = false) => {
    try {
      const res = await fetch(`/api/tickets/${id}?page=${page}`);
      if (res.status === 404) { setError("Ticket not found."); return; }
      if (res.status === 403) { setError("You don't have access to this ticket."); return; }
      if (!res.ok) { setError("Failed to load ticket."); return; }
      const data = await res.json();
      const prevTotal = pagination.total;
      setTicket(data.ticket);
      setMessages(data.messages || []);
      setPagination(data.pagination);

      if (scrollToBottom) {
        scrollBottomRef.current = true;
      } else if ((data.pagination?.total || 0) > prevTotal && prevTotal > 0) {
        setFlash(true);
        setTimeout(() => setFlash(false), 600);
      }
    } catch {
      setError("Failed to load ticket.");
    } finally {
      setLoading(false);
    }
  }, [id, pagination.total]);

  useEffect(() => {
    if (!authLoading) fetchTicket(1);
  }, [authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom after new message sent
  useEffect(() => {
    if (scrollBottomRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      scrollBottomRef.current = false;
    }
  }, [messages]);

  // Poll — only latest page
  useEffect(() => {
    if (authLoading || loading || error) return;
    const interval = setInterval(() => fetchTicket(pagination.page), 3000);
    return () => clearInterval(interval);
  }, [authLoading, loading, error, fetchTicket, pagination.page]);

  const goToPage = (p: number) => {
    const clamped = Math.max(1, Math.min(p, pagination.totalPages));
    fetchTicket(clamped);
    if (clamped === pagination.totalPages) setJumpedToLatest(true);
  };

  const handleStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) { const d = await res.json(); setTicket(d.ticket); }
    } finally { setUpdating(false); }
  };

  const handlePriority = async (newPriority: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
      if (res.ok) { const d = await res.json(); setTicket(d.ticket); }
    } finally { setUpdating(false); }
  };

  const handleAssign = async () => {
    if (!user || !ticket) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedTo: ticket.assignedTo ? null : user.id,
          assignedToUsername: ticket.assignedTo ? null : user.username,
        }),
      });
      if (res.ok) { const d = await res.json(); setTicket(d.ticket); }
    } finally { setUpdating(false); }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim(), isInternal }),
      });
      if (res.ok) {
        setNewMessage("");
        setIsInternal(false);
        fetchTicket(1, true); // jump to latest
      }
    } finally { setSending(false); }
  };

  // ─── Loading / Auth / Error states ───
  if (authLoading || loading) {
    return (
      <div className="h-screen flex flex-col bg-[#050507]">
        <header className="shrink-0 border-b border-white/[0.06] bg-[#050507]/90 z-30">
          <div className="h-16" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-3 py-2">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <div className="flex-1 min-w-0">
                <Skeleton className="h-3 w-40 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-hidden max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-4">
          <Skeleton className="h-20 w-2/3 rounded-2xl ml-auto" />
          <Skeleton className="h-16 w-3/4 rounded-2xl" />
          <Skeleton className="h-24 w-1/2 rounded-2xl ml-auto" />
          <Skeleton className="h-14 w-3/5 rounded-2xl" />
        </div>
        <div className="shrink-0 border-t border-white/[0.06] p-4">
          <Skeleton className="h-12 w-full max-w-6xl mx-auto rounded-xl" />
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <section className="h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-display text-4xl fire-text mb-4">Login Required</h1>
          <p className="text-text-muted mb-6">You need to login with Discord to view tickets.</p>
          <a href={discordUrl} className="px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] rounded-xl text-white font-semibold transition-colors">
            Login with Discord
          </a>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-display text-4xl fire-text mb-4">{error}</h1>
          <button
            onClick={() => router.push("/tickets")}
            className="mt-4 px-5 py-2.5 rounded-xl border border-white/[0.08] text-text-dim text-sm font-semibold hover:border-white/[0.15] hover:text-text transition-all"
          >
            Back to Tickets
          </button>
        </div>
      </section>
    );
  }

  if (!ticket) return null;

  const typeInfo = TICKET_TYPES.find((t) => t.slug === ticket.type);
  const typeStyle = typeInfo ? getTicketTypeStyle(typeInfo) : null;
  const statusInfo = STATUS_OPTIONS.find((s) => s.value === ticket.status);
  const createdAt = new Date(ticket.createdAt).toLocaleString("en-US", {
    month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="h-screen flex flex-col bg-[#050507]">
      {/* Background blobs */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[10%] w-[700px] h-[600px] bg-crimson/[0.04] rounded-full blur-[160px]" />
        <div className="absolute bottom-[-20%] right-[10%] w-[600px] h-[500px] bg-gold/[0.03] rounded-full blur-[140px]" />
      </div>

      {/* ─── Top bar (fixed) ─── */}
      <header className="shrink-0 border-b border-white/[0.06] bg-[#050507]/90 backdrop-blur-xl z-30" style={{ paddingTop: "env(safe-area-inset-top, 0)" }}>
        {/* Nav offset spacer */}
        <div className="h-16" />

        {/* Back + ticket meta */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 py-2">
            <button
              onClick={() => router.push("/tickets")}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.06] text-text-muted hover:text-text hover:border-white/[0.12] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-text-muted font-mono">{ticket.id.slice(0, 8)}</span>
                {typeInfo && typeStyle && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider border"
                    style={{ color: typeStyle.color, background: typeStyle.bg, borderColor: typeStyle.border }}
                  >
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={typeInfo.icon} />
                    </svg>
                    {typeInfo.name}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusInfo?.bg} ${statusInfo?.color} ${statusInfo?.border}`}>
                  <span className={`w-1 h-1 rounded-full ${ticket.status === "open" ? "bg-emerald-400" : ticket.status === "in-progress" ? "bg-amber-400" : "bg-white/30"}`} />
                  {statusInfo?.label}
                </span>
              </div>
              <h1 className="text-sm font-semibold text-text truncate">{ticket.subject}</h1>
            </div>

            <div className="hidden sm:flex items-center gap-3 text-[11px] text-text-muted shrink-0">
              <button onClick={() => router.push(`/profile/${ticket.userId}`)} className="hover:text-crimson transition-colors">
                @{ticket.username}
              </button>
              {ticket.userRole && ROLE_BADGES[ticket.userRole] && (
                <span className={`text-[8px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${ROLE_BADGES[ticket.userRole]}`}>
                  {ticket.userRole}
                </span>
              )}
              <span className="text-text-muted/30">|</span>
              <span>{createdAt}</span>
              {ticket.assignedToUsername && (
                <>
                  <span className="text-text-muted/30">|</span>
                  <span className="text-gold">@{ticket.assignedToUsername}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Staff controls row */}
        {isStaff && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-2">
            <div className="flex flex-wrap items-center gap-2">
              {/* Status dropdown */}
              <select
                value={ticket.status}
                onChange={(e) => handleStatus(e.target.value)}
                disabled={updating}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wider border bg-transparent transition-all focus:outline-none focus:border-crimson/40 disabled:opacity-40 ${
                  ticket.status === "open" ? "border-emerald-500/30 text-emerald-400" :
                  ticket.status === "in-progress" ? "border-amber-500/30 text-amber-400" :
                  "border-white/[0.08] text-text-muted"
                }`}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value} className="bg-[#0c0c10] text-text">
                    {s.label}
                  </option>
                ))}
              </select>

              {/* Priority dropdown */}
              <select
                value={ticket.priority}
                onChange={(e) => handlePriority(e.target.value)}
                disabled={updating}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium border bg-transparent transition-all focus:outline-none focus:border-crimson/40 disabled:opacity-40 ${
                  ticket.priority === "urgent" ? "border-red-500/30 text-red-400" :
                  ticket.priority === "high" ? "border-orange-500/30 text-orange-400" :
                  ticket.priority === "medium" ? "border-blue-500/30 text-blue-400" :
                  "border-white/[0.08] text-text-muted"
                }`}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value} className="bg-[#0c0c10] text-text">
                    {p.label}
                  </option>
                ))}
              </select>

              {/* Assign */}
              <button
                onClick={handleAssign}
                disabled={updating}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all border ${
                  ticket.assignedTo
                    ? "bg-crimson/15 border-crimson/30 text-crimson"
                    : "border-white/[0.08] text-text-muted hover:border-white/[0.15] hover:text-text-dim"
                } disabled:opacity-40`}
              >
                {ticket.assignedTo ? "Unassign" : "Assign"}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ─── Messages (scrollable) ─── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          {/* Description card */}
          <div className="mb-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.015]">
            <p className="text-xs text-text-muted mb-1 uppercase tracking-wider font-semibold">Description</p>
            <p className="text-sm text-text-dim whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
          </div>

          {/* Pagination top bar */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[10px] text-text-muted">
                {pagination.total.toLocaleString()} messages · Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => goToPage(1)}
                  disabled={pagination.page <= 1}
                  className="px-2 py-1 rounded text-[10px] text-text-muted hover:text-text border border-white/[0.06] hover:border-white/[0.12] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Newest
                </button>
                <button
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-2 py-1 rounded text-[10px] text-text-muted hover:text-text border border-white/[0.06] hover:border-white/[0.12] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ← Older
                </button>
                <button
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-2 py-1 rounded text-[10px] text-text-muted hover:text-text border border-white/[0.06] hover:border-white/[0.12] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Newer →
                </button>
                <button
                  onClick={() => goToPage(pagination.totalPages)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-2 py-1 rounded text-[10px] text-text-muted hover:text-text border border-white/[0.06] hover:border-white/[0.12] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Latest
                </button>
              </div>
            </div>
          )}

          {/* Jump-to-latest banner */}
          {pagination.totalPages > 1 && pagination.page < pagination.totalPages && (
            <button
              onClick={() => goToPage(pagination.totalPages)}
              className="w-full mb-3 py-2 rounded-xl border border-crimson/20 bg-crimson/[0.04] text-crimson text-[11px] font-semibold hover:bg-crimson/[0.08] transition-colors"
            >
              ↓ Jump to latest messages ({pagination.total - (pagination.totalPages - 1) * pagination.limit} new)
            </button>
          )}

          {/* Message list */}
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-12 h-12 text-text-muted/15 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-text-muted text-sm">No messages yet.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map((msg, i) => {
                const showDate = i === messages.length - 1 || !sameDay(msg.createdAt, messages[i + 1]?.createdAt);
                const isSelf = user && msg.userId === user.id;

                return (
                  <div key={msg.id}>
                    {/* Date separator */}
                    {showDate && (
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-white/[0.04]" />
                        <span className="text-[9px] text-text-muted/50 uppercase tracking-wider font-medium shrink-0">
                          {formatFullDate(msg.createdAt)}
                        </span>
                        <div className="flex-1 h-px bg-white/[0.04]" />
                      </div>
                    )}

                    <div
                      className={`msg-enter group flex gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-white/[0.02] ${
                        msg.isInternal ? "bg-amber-500/[0.03] border border-amber-500/10 hover:bg-amber-500/[0.06]" : ""
                      }`}
                      style={{ animationDelay: `${Math.min(i * 20, 400)}ms` }}
                    >
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden mt-0.5">
                        {msg.avatar ? (
                          <img src={msg.avatar} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                          <span className="text-xs text-text-muted font-semibold">{msg.username[0]?.toUpperCase()}</span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <button
                            onClick={() => router.push(`/profile/${msg.userId}`)}
                            className={`text-sm font-semibold hover:underline transition-colors ${isSelf ? "text-crimson" : "text-text"}`}
                          >
                            @{msg.username}
                          </button>
                          {msg.isInternal && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[8px] text-amber-400 uppercase tracking-wider font-bold">
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              Staff Note
                            </span>
                          )}
                          <span className="text-[10px] text-text-muted/40 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                            {formatMsgTime(msg.createdAt)}
                          </span>
                          <span className="text-[10px] text-text-muted/40 sm:hidden">
                            {formatMsgTime(msg.createdAt)}
                          </span>
                        </div>
                        <p className="text-[13px] text-text-dim/90 whitespace-pre-wrap leading-relaxed break-words">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom padding for input clearance */}
          <div className="h-24" />
        </div>
      </div>

      {/* ─── Input bar (fixed bottom) ─── */}
      <div className="shrink-0 border-t border-white/[0.06] bg-[#050507]/95 backdrop-blur-xl z-30" style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}>
        {ticket.status === "closed" ? (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.015]">
              <svg className="w-4 h-4 text-text-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xs text-text-muted/50">This ticket is closed.</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex gap-2 items-end">
              {isStaff && (
                <button
                  type="button"
                  onClick={() => setIsInternal(!isInternal)}
                  className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-xs transition-all ${
                    isInternal
                      ? "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                      : "border border-white/[0.06] text-text-muted hover:border-white/[0.12] hover:text-text-dim"
                  }`}
                  title="Toggle internal note"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </button>
              )}
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isInternal ? "Write an internal staff note..." : "Type a message..."}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-text text-sm placeholder:text-text-muted/30 focus:outline-none focus:border-crimson/40 transition-colors"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="shrink-0 h-9 px-5 rounded-xl bg-crimson hover:bg-crimson/80 text-white text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(196,30,58,0.3)]"
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Send"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
