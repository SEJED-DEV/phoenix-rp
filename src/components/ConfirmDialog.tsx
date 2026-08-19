"use client";

import { useEffect, useState } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  error?: string;
  /** When true, shows an optional reason input (used for staff deletion logs). */
  showReason?: boolean;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = true,
  busy = false,
  error,
  showReason = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  if (!open) return null;

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && !busy) onCancel();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={busy ? undefined : onCancel} />
      <div
        onKeyDown={handleKey}
        className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0c0c10]/95 backdrop-blur-xl shadow-2xl overflow-hidden"
      >
        <div
          className={`h-px w-full ${
            danger ? "bg-gradient-to-r from-transparent via-red-500/60 to-transparent" : "bg-gradient-to-r from-transparent via-crimson/60 to-transparent"
          }`}
        />

        <div className="p-6">
          <div className="flex items-start gap-3.5 mb-4">
            <div
              className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${
                danger ? "bg-red-500/10 border-red-500/25 text-red-400" : "bg-crimson/10 border-crimson/25 text-crimson"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-semibold text-text leading-tight">{title}</h3>
              <p className="text-[13px] text-text-muted mt-1 leading-relaxed whitespace-pre-line">{message}</p>
            </div>
          </div>

          {showReason && (
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional, visible in staff logs)"
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-text text-sm placeholder:text-text-muted/30 focus:outline-none focus:border-crimson/40 transition-colors resize-none"
            />
          )}

          {error && (
            <p className="text-[12px] text-red-400 mt-3">{error}</p>
          )}

          <div className="flex items-center justify-end gap-2.5 mt-5">
            <button
              onClick={onCancel}
              disabled={busy}
              className="px-4 py-2 rounded-lg border border-white/[0.08] text-text-muted text-xs font-semibold hover:text-text hover:border-white/[0.15] transition-all disabled:opacity-40"
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => onConfirm(reason.trim() || undefined)}
              disabled={busy}
              className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-40 ${
                danger
                  ? "bg-red-500/90 hover:bg-red-500"
                  : "bg-crimson hover:bg-crimson/80"
              }`}
            >
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deleting…
                </span>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
