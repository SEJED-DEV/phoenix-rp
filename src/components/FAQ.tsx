"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_FAQS, type Faq } from "@/lib/faq.defaults";

function renderFaqAnswer(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|(https?:\/\/[^\s<>"')\]]+)/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const label = m[1];
    const href = m[2] || m[3];
    if (href) {
      nodes.push(
        <a
          key={key++}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-crimson hover:text-gold underline underline-offset-2 break-all"
        >
          {label || href}
        </a>
      );
    }
    last = regex.lastIndex;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export default function FAQ() {
  const [faqs, setFaqs] = useState<Faq[]>(DEFAULT_FAQS);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/faq")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { faqs?: Faq[] } | null) => {
        if (!cancelled && d && Array.isArray(d.faqs) && d.faqs.length > 0) {
          setFaqs(d.faqs);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return faqs.map((f, i) => ({ ...f, idx: i }));
    return faqs
      .map((f, i) => ({ ...f, idx: i }))
      .filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [query, faqs]);

  const searching = query.trim().length > 0;
  const isOpen = (i: number) => (searching ? true : openIdx === i);

  return (
    <section id="faq" className="relative py-20 sm:py-28 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#050507]" />
        <div className="absolute top-[-25%] left-[25%] w-[700px] h-[600px] bg-crimson/[0.05] rounded-full blur-[160px]" />
        <div className="absolute bottom-[-20%] right-[10%] w-[500px] h-[400px] bg-gold/[0.03] rounded-full blur-[140px]" />
      </div>
      <div className="absolute inset-0 mosaic-pattern pointer-events-none opacity-30" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_20%,#050507_85%)] z-[1]" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-8 stagger-1">
            <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent via-crimson/60 to-crimson" />
            <span className="font-display text-[11px] sm:text-xs tracking-[0.4em] text-gold/60 uppercase">Help Center</span>
            <div className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent via-crimson/60 to-crimson" />
          </div>

          <h1 className="font-display leading-[0.85] tracking-[0.03em] stagger-2">
            <span className="block text-[2.2rem] sm:text-6xl md:text-7xl fire-text">GOT</span>
            <span
              className="block text-[3rem] sm:text-7xl md:text-8xl text-text mt-3"
              style={{ textShadow: "0 0 80px rgba(196,30,58,0.12)" }}
            >
              QUESTIONS?
            </span>
          </h1>

          <p className="text-text-muted text-sm sm:text-base leading-relaxed mt-8 stagger-3">
            Answers to the most common questions about joining, applying, and playing in the city.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-10 stagger-4">
          <div className="relative">
            <svg
              className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions..."
              className="w-full pl-11 pr-10 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-text-muted/30 text-sm focus:outline-none focus:border-crimson/40 transition-colors"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted/50 hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Results count */}
        <p className="text-center text-[11px] text-text-muted/60 mb-6 stagger-4">
          {filtered.length === 1 ? "1 question" : `${filtered.length} questions`}
        </p>

        {/* Accordion */}
        <div className="space-y-3.5">
          {filtered.map((f, i) => {
            const open = isOpen(f.idx);
            return (
              <div
                key={f.idx}
                className={`group relative rounded-xl overflow-hidden transition-all duration-500 stagger-${Math.min(i + 1, 5)} border ${
                  open
                    ? "border-crimson/25 bg-crimson/[0.03]"
                    : "border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12]"
                }`}
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <button
                  onClick={() => setOpenIdx(openIdx === f.idx ? null : f.idx)}
                  className="w-full flex items-center gap-4 sm:gap-5 p-5 sm:p-6 text-left"
                >
                  <span
                    className={`font-display text-sm tracking-wider transition-colors duration-300 ${
                      open ? "text-crimson" : "text-text-muted/40 group-hover:text-text-muted/70"
                    }`}
                  >
                    {String(f.idx + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`flex-1 text-sm sm:text-base transition-colors duration-300 ${
                      open ? "text-white font-medium" : "text-text-dim group-hover:text-text"
                    }`}
                  >
                    {f.q}
                  </span>
                  <span
                    className={`w-8 h-8 flex items-center justify-center border rounded-lg transition-all duration-300 flex-shrink-0 ${
                      open
                        ? "border-crimson/50 bg-crimson/10 rotate-45"
                        : "border-white/[0.08] group-hover:border-white/[0.2]"
                    }`}
                  >
                    <svg className="w-4 h-4 text-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                </button>

                <div className={`accordion-body ${open ? "open" : ""}`}>
                  <div>
                    <div className="px-5 sm:px-6 pb-6 sm:pb-6 pl-[3.6rem] sm:pl-16 text-sm text-text-muted leading-relaxed">
                      <div className="border-l border-crimson/20 pl-4 whitespace-pre-wrap">{renderFaqAnswer(f.a)}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* No results */}
        {filtered.length === 0 && (
          <div className="rounded-2xl py-16 text-center" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            <svg className="w-10 h-10 mx-auto mb-3 text-text-muted/20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
            <p className="text-text-muted text-sm">No questions match &ldquo;{query}&rdquo;.</p>
            <button onClick={() => setQuery("")} className="mt-3 text-xs text-crimson hover:underline">
              Clear search
            </button>
          </div>
        )}

        {/* Closing callout */}
        <div className="mt-14 sm:mt-20 text-center stagger-1">
          <div className="inline-flex flex-wrap items-center justify-center gap-3 px-6 py-4 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-gold/70 animate-pulse" />
            <p className="text-text-muted text-xs sm:text-sm">
              Still stuck? Open a ticket — staff responds within 48 hours.
            </p>
            <a
              href="https://discord.gg/rapZCCQBv"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-semibold tracking-widest uppercase rounded-lg border border-gold/30 text-gold/80 hover:bg-gold/10 hover:text-gold hover:border-gold/50 transition-all duration-300"
            >
              Join Discord
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 fire-line z-20" />
    </section>
  );
}
