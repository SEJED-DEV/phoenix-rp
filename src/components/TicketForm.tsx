"use client";

import { useRef, useState } from "react";
import { type TicketType, getTicketTypeStyle } from "@/lib/tickets.config";

interface TicketFormProps {
  availableTypes: TicketType[];
  openTicketTypes?: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TicketForm({ availableTypes, openTicketTypes = [], onSuccess, onCancel }: TicketFormProps) {
  const [type, setType] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected].slice(0, 8));
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("subject", subject);
      formData.append("description", description);
      for (const f of files) formData.append("files", f);

      const res = await fetch("/api/tickets", {
        method: "POST",
        body: formData,
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

          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Attachments
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-white/[0.12] text-text-muted text-sm hover:border-crimson/40 hover:text-text transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Add files or images
              <span className="text-[10px] text-text-muted/50">(10MB max each, up to 8)</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.gif,.webp,.bmp,.pdf,.txt,.md,.log,.zip,.rar,.json,.csv,.mp4,.webm,.mov,.mp3,.wav,.ogg"
              className="hidden"
              onChange={handleFileSelect}
            />
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {files.map((f, i) => (
                  <div
                    key={`${f.name}-${i}`}
                    className="flex items-center gap-2 pl-2.5 pr-1.5 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03]"
                  >
                    <span className="text-[11px] text-text truncate max-w-[140px]">{f.name}</span>
                    <span className="text-[9px] text-text-muted/50 shrink-0">{formatBytes(f.size)}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      aria-label={`Remove ${f.name}`}
                      className="w-5 h-5 flex items-center justify-center rounded text-text-muted hover:text-crimson hover:bg-white/[0.06] transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
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
