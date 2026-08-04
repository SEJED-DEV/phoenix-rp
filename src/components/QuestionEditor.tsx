"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ApplicationField } from "@/lib/applications.data";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";

interface EditorData {
  dept: string;
  label: string;
  questions: ApplicationField[];
  defaults: ApplicationField[];
}

interface Toast {
  type: "success" | "error" | "info";
  text: string;
}

const TYPES: { value: ApplicationField["type"]; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "number", label: "Number" },
  { value: "select", label: "Select" },
];

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-text-muted/30 text-xs focus:outline-none focus:border-crimson/40 transition-all";
const labelClass = "block text-[10px] text-text-muted uppercase tracking-wider mb-1.5";

export default function QuestionEditor({ dept }: { dept: string }) {
  const [data, setData] = useState<EditorData | null>(null);
  const [questions, setQuestions] = useState<ApplicationField[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/staff/app-config/questions/${encodeURIComponent(dept)}`)
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
        setQuestions(d.questions);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dept]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const flash = (type: Toast["type"], text: string) => setToast({ type, text });

  const update = (index: number, patch: Partial<ApplicationField>) => {
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  };

  const move = (index: number, dir: -1 | 1) => {
    setQuestions((qs) => {
      const next = [...qs];
      const target = index + dir;
      if (target < 0 || target >= next.length) return qs;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const remove = (index: number) => {
    setQuestions((qs) => qs.filter((_, i) => i !== index));
  };

  const add = () => {
    setQuestions((qs) => [
      ...qs,
      {
        name: `new_question_${Date.now()}`,
        label: "New Question",
        type: "text",
        required: false,
        placeholder: "",
      },
    ]);
  };

  const restoreDefaults = () => {
    if (!data) return;
    setQuestions(data.defaults);
    flash("info", "Defaults loaded — press Save to apply.");
  };

  const validate = (): string | null => {
    if (questions.length === 0) return "Add at least one question.";
    const seen = new Set<string>();
    for (const q of questions) {
      if (!q.name.trim()) return "Every question needs a name (key).";
      if (!q.label.trim()) return `Question "${q.name}" needs a label.`;
      if (seen.has(q.name.trim())) return `Duplicate question name: "${q.name}"`;
      seen.add(q.name.trim());
      if (q.type === "select" && (!q.options || q.options.length === 0)) {
        return `Question "${q.name}" is a select but has no options.`;
      }
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
      const res = await fetch(`/api/staff/app-config/questions/${encodeURIComponent(dept)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions }),
      });
      if (res.ok) {
        const body = await res.json();
        flash(
          "success",
          `Saved — ${body.diff.added.length} added, ${body.diff.changed.length} changed, ${body.diff.removed.length} removed.`,
        );
        const fresh = await fetch(`/api/staff/app-config/questions/${encodeURIComponent(dept)}`);
        if (fresh.ok) {
          const d = await fresh.json();
          setData(d);
          setQuestions(d.questions);
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
              <Skeleton className="h-16 w-full mb-3" />
              <Skeleton className="h-8 w-full" />
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
        <p className="text-text-muted text-sm mb-6">You don&apos;t have permission to edit these questions.</p>
        <Link href="/staff-panel" className="text-crimson text-sm hover:text-crimson/80 transition-colors">
          Back to Staff Panel
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-40">
        <p className="text-text-muted text-sm">Failed to load questions.</p>
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
          <span className="text-white text-sm">Questions</span>
        </div>
        <h1 className="font-display text-2xl tracking-wider text-white">{data.label} — Questions</h1>
        <p className="text-text-muted text-xs mt-1.5">
          Edit labels, order, and requirements. The <span className="text-white/70">name</span> is the stable key tied to
          past submissions — renaming it detaches old answers.
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
        {questions.map((q, i) => (
          <div
            key={`${q.name}-${i}`}
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
              <div className="flex-1">
                <input
                  type="text"
                  value={q.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  placeholder="name / key"
                  className={`${inputClass} font-mono text-[11px]`}
                />
              </div>
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
                disabled={i === questions.length - 1}
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

            {/* Label */}
            <div className="mb-3">
              <label className={labelClass}>Label</label>
              <textarea
                value={q.label}
                onChange={(e) => update(i, { label: e.target.value })}
                rows={2}
                placeholder="The question shown to applicants"
                className={`${inputClass} resize-y`}
              />
            </div>

            {/* Type + required */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className={labelClass}>Type</label>
                <select
                  value={q.type}
                  onChange={(e) => update(i, { type: e.target.value as ApplicationField["type"] })}
                  className={inputClass}
                >
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Placeholder</label>
                <input
                  type="text"
                  value={q.placeholder || ""}
                  onChange={(e) => update(i, { placeholder: e.target.value })}
                  placeholder="Optional hint text"
                  className={inputClass}
                />
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-xs text-text-muted cursor-pointer select-none">
              <input
                type="checkbox"
                checked={q.required}
                onChange={(e) => update(i, { required: e.target.checked })}
                className="w-4 h-4 rounded accent-crimson"
              />
              Required
            </label>

            {q.type === "select" && (
              <div className="mt-3">
                <label className={labelClass}>Options (one per line)</label>
                <textarea
                  value={(q.options || []).join("\n")}
                  onChange={(e) =>
                    update(i, { options: e.target.value.split("\n").map((o) => o.trim()).filter(Boolean) })
                  }
                  rows={3}
                  placeholder={"Option 1\nOption 2"}
                  className={`${inputClass} resize-y font-mono text-[11px]`}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="sticky bottom-4 flex items-center gap-3 p-4 rounded-2xl backdrop-blur-md"
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
