"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Faq } from "@/lib/faq.defaults";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";

interface EditorData {
  faqs: Faq[];
  defaults: Faq[];
}

interface Toast {
  type: "success" | "error" | "info";
  text: string;
}

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-text-muted/30 text-xs focus:outline-none focus:border-crimson/40 transition-all";
const labelClass = "block text-[10px] text-text-muted uppercase tracking-wider mb-1.5";

export default function FaqEditor() {
  const [data, setData] = useState<EditorData | null>(null);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/staff/app-config/faq")
      .then(async (r) => {
        if (r.status === 403) {
          if (!cancelled) setDenied(true);
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((d: EditorData | null) => {
        if (cancelled || !d) return;
        setData(d);
        setFaqs(d.faqs);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const flash = (type: Toast["type"], text: string) => setToast({ type, text });

  const update = (index: number, patch: Partial<Faq>) => {
    setFaqs((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  };

  const move = (index: number, dir: -1 | 1) => {
    setFaqs((qs) => {
      const next = [...qs];
      const target = index + dir;
      if (target < 0 || target >= next.length) return qs;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const remove = (index: number) => {
    setFaqs((qs) => qs.filter((_, i) => i !== index));
  };

  const add = () => {
    setFaqs((qs) => [...qs, { q: "New Question", a: "" }]);
  };

  const restoreDefaults = () => {
    if (!data) return;
    setFaqs(data.defaults);
    flash("info", "Defaults loaded — press Save to apply.");
  };

  const validate = (): string | null => {
    if (faqs.length === 0) return "Add at least one FAQ.";
    for (const f of faqs) {
      if (!f.q.trim()) return "Every FAQ needs a question.";
      if (!f.a.trim()) return `FAQ "${f.q}" needs an answer.`;
    }
    return null;
  };

  const save = async () => {
    const err = validate();
    if (err) {
      flash("error", err);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/staff/app-config/faq", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faqs }),
      });
      if (res.ok) {
        const body = await res.json();
        flash(
          "success",
          `Saved — ${body.diff.added} added, ${body.diff.changed} changed, ${body.diff.removed} removed.`,
        );
        const fresh = await fetch("/api/staff/app-config/faq");
        if (fresh.ok) {
          const d = await fresh.json();
          setData(d);
          setFaqs(d.faqs);
        }
      } else {
        const errBody = await res.json();
        flash("error", errBody.error || "Failed to save.");
      }
    } catch {
      flash("error", "Network error.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Skeleton className="h-6 w-56 mb-8" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="p-5">
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-10 w-full mb-3" />
              <Skeleton className="h-20 w-full" />
            </SkeletonCard>
          ))}
        </div>
      </div>
    );
  }

  if (denied) {
    return (
      <div className="text-center py-40">
        <h1 className="font-display text-2xl tracking-wider text-white mb-3">Access Denied</h1>
        <p className="text-text-muted text-sm mb-6">You don&apos;t have permission to edit the FAQ.</p>
        <Link href="/staff-panel" className="text-crimson text-sm hover:text-crimson/80 transition-colors">
          Back to Staff Panel
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-40">
        <p className="text-text-muted text-sm">Failed to load FAQ.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/staff-panel" className="text-text-muted hover:text-white transition-colors text-sm">
            Staff Panel
          </Link>
          <svg className="w-3 h-3 text-text-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/staff-panel/config" className="text-text-muted hover:text-white transition-colors text-sm">
            Config
          </Link>
          <svg className="w-3 h-3 text-text-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-white text-sm">FAQ</span>
        </div>
        <h1 className="font-display text-2xl tracking-wider text-white">FAQ — Questions</h1>
        <p className="text-text-muted text-xs mt-1.5">
          Edit the questions and answers shown on the public /faq page. Changes apply immediately.
        </p>
      </div>

      {toast && (
        <div
          className={`mb-6 px-4 py-3 rounded-xl text-sm ${
            toast.type === "success"
              ? "bg-green-500/10 border border-green-500/20 text-green-400"
              : toast.type === "error"
                ? "bg-red-500/10 border border-red-500/20 text-red-400"
                : "bg-blue-500/10 border border-blue-500/20 text-blue-400"
          }`}
        >
          {toast.text}
        </div>
      )}

      <div className="space-y-4 mb-8">
        {faqs.map((f, i) => (
          <div
            key={i}
            className="rounded-2xl p-5"
            style={{
              background: "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            {/* Header row */}
            <div className="flex items-center gap-2 mb-4">
              <span className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-[10px] text-text-muted border border-white/[0.06]">
                {i + 1}
              </span>
              <span className="flex-1 text-[10px] uppercase tracking-wider text-text-muted/60">Question</span>
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] text-text-muted hover:text-white disabled:opacity-25 flex items-center justify-center transition-all"
                aria-label="Move up"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === faqs.length - 1}
                className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] text-text-muted hover:text-white disabled:opacity-25 flex items-center justify-center transition-all"
                aria-label="Move down"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                onClick={() => remove(i)}
                className="w-8 h-8 rounded-lg bg-red-500/[0.06] border border-red-500/15 text-red-400 hover:bg-red-500/15 flex items-center justify-center transition-all"
                aria-label="Delete question"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Question */}
            <div className="mb-3">
              <label className={labelClass}>Question</label>
              <input
                type="text"
                value={f.q}
                onChange={(e) => update(i, { q: e.target.value })}
                placeholder="The question shown to visitors"
                className={inputClass}
              />
            </div>

            {/* Answer */}
            <div>
              <label className={labelClass}>Answer</label>
              <textarea
                value={f.a}
                onChange={(e) => update(i, { a: e.target.value })}
                rows={4}
                placeholder="The answer shown to visitors"
                className={`${inputClass} resize-y`}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        className="sticky bottom-4 flex items-center gap-3 p-4 rounded-2xl backdrop-blur-md"
        style={{
          background: "rgba(11,11,15,0.85)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <button
          onClick={add}
          className="flex-1 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white text-sm font-medium hover:bg-white/[0.09] transition-all"
        >
          + Add question
        </button>
        <button
          onClick={restoreDefaults}
          className="px-5 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-text-muted text-sm hover:text-white transition-all"
        >
          Reset to defaults
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="flex-1 py-3 rounded-xl bg-crimson hover:bg-crimson/80 disabled:opacity-50 text-white text-sm font-semibold transition-all"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}
