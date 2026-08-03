"use client";

import { useState } from "react";
import { type TicketType, getTicketTypeStyle } from "@/lib/tickets.config";

interface TicketFormProps {
  availableTypes: TicketType[];
  openTicketTypes?: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TicketForm({ availableTypes, openTicketTypes = [], onSuccess, onCancel }: TicketFormProps) {
  const [type, setType] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, subject, description }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create ticket");
        return;
      }

      onSuccess();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0c0c10]/95 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl fire-text">New Ticket</h2>
            <button onClick={onCancel} className="text-text-muted hover:text-text transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/[0.06] text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Ticket Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableTypes.map((t) => {
                const isOpen = openTicketTypes.includes(t.slug);
                const tStyle = getTicketTypeStyle(t);
                const isSelected = type === t.slug;
                return (
                  <button
                    key={t.slug}
                    type="button"
                    onClick={() => !isOpen && setType(t.slug)}
                    disabled={isOpen}
                    className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                      isOpen
                        ? "border-white/[0.04] bg-white/[0.01] opacity-40 cursor-not-allowed"
                        : isSelected
                          ? "bg-white/[0.03]"
                          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                    }`}
                    style={!isOpen && isSelected ? { borderColor: tStyle.border, background: tStyle.bg } : undefined}
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        style={isOpen ? undefined : { color: tStyle.color }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={t.icon} />
                      </svg>
                      <span className={`text-sm font-medium ${isOpen ? "text-text-muted" : isSelected ? "text-text" : "text-text-dim"}`}>
                        {t.name}
                      </span>
                    </div>
                    {isOpen && (
                      <span className="block text-[10px] text-text-muted mt-1">Already open</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your ticket"
              className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-text text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-crimson/40 transition-colors"
              required
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about your ticket..."
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-text text-sm placeholder:text-text-muted/50 focus:outline-none focus:border-crimson/40 transition-colors resize-none"
              required
              maxLength={2000}
            />
            <div className="text-right text-xs text-text-muted mt-1">{description.length}/2000</div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-xl border border-white/[0.08] text-text-dim text-sm font-semibold hover:border-white/[0.15] hover:text-text transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !type || !subject || !description}
              className="flex-1 px-4 py-3 rounded-xl bg-crimson hover:bg-crimson/80 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
