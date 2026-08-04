"use client";

import { useState, useEffect, useRef } from "react";

const faqs = [
  { q: "How do I join the server?", a: "Join our Discord, complete the whitelist application, and once approved you can connect using the FiveM server IP provided in the #server-info channel." },
  { q: "What are the server requirements?", a: "A stable internet connection and a legitimate copy of GTA V. We recommend at least 8GB RAM and a dedicated GPU for the best experience." },
  { q: "Is there a whitelist?", a: "Yes. All new players must complete a brief whitelist application to ensure everyone understands our rules and roleplay standards." },
  { q: "Can I play as a cop or EMS?", a: "Absolutely. Once whitelisted, you can apply for any department position. Training is provided for all roles." },
  { q: "Are there families?", a: "Yes. Multiple families operate in the city. You can create your own crew or join an existing organization." },
  { q: "How do I report a rule violation?", a: "Open a ticket in our Discord with evidence (screenshots or video clips). Staff reviews all reports within 48 hours." },
  { q: "What language is used on the server?", a: "English is the primary language for RP. Tunisian Arabic is welcome in appropriate contexts and casual interactions." },
];

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="faq" ref={sectionRef} className="relative py-32 sm:py-40 lg:py-52 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#050507]" />
        <div className="absolute top-[-25%] left-[25%] w-[700px] h-[600px] bg-crimson/[0.05] rounded-full blur-[160px]" />
      </div>
      <div className="absolute inset-0 mosaic-pattern pointer-events-none opacity-30" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_20%,#050507_85%)] z-[1]" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section tag */}
        <div
          className="flex items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-14"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s",
          }}
        >
          <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent via-crimson/60 to-crimson" />
          <span className="font-display text-[11px] sm:text-xs tracking-[0.4em] text-gold/60 uppercase">FAQ</span>
          <div className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent via-crimson/60 to-crimson" />
        </div>

        {/* Title */}
        <div
          className="text-center mb-14 sm:mb-20"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(50px)",
            transition: "all 1.2s cubic-bezier(0.16,1,0.3,1) 0.2s",
          }}
        >
          <h2 className="font-display leading-[0.85] tracking-[0.03em]">
            <span className="block text-[2.2rem] sm:text-6xl md:text-7xl lg:text-8xl fire-text">GOT</span>
            <span
              className="block text-[3rem] sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] text-text mt-2"
              style={{ textShadow: "0 0 80px rgba(196,30,58,0.12)" }}
            >
              QUESTIONS?
            </span>
          </h2>
        </div>

        {/* Accordion */}
        <div
          className="space-y-4"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(30px)",
            transition: "all 1s cubic-bezier(0.16,1,0.3,1) 0.4s",
          }}
        >
          {faqs.map((f, i) => (
            <div
              key={i}
              className="group rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm overflow-hidden hover:border-white/[0.1] transition-all duration-400"
            >
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center justify-between p-6 sm:p-7 text-left"
              >
                <span className="font-medium text-sm sm:text-base pr-4 text-text-dim group-hover:text-text transition-colors">
                  {f.q}
                </span>
                <div
                  className={`w-8 h-8 flex items-center justify-center border rounded-md transition-all duration-300 flex-shrink-0 ${
                    openIdx === i
                      ? "border-crimson/50 bg-crimson/10 rotate-45"
                      : "border-white/[0.08] group-hover:border-white/[0.15]"
                  }`}
                >
                  <svg className="w-4 h-4 text-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </button>

              <div className={`accordion-body ${openIdx === i ? "open" : ""}`}>
                <div>
                  <div className="px-6 sm:px-7 pb-6 sm:pb-7 text-sm sm:text-[15px] text-text-muted leading-relaxed pl-12 sm:pl-14">
                    {f.a}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 fire-line z-20" />
    </section>
  );
}
