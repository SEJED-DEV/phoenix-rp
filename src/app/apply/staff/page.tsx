"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getDiscordLoginUrl } from "@/lib/auth-client";
import { STAFF_APPLICATIONS } from "@/lib/applications.data";

const STAFF_IMAGES = [
  "/media/ChatGPT_Image_22_juin_2026_02_02_52.png",
  "/media/ChatGPT_Image_22_juin_2026_02_23_43.png",
  "/media/ChatGPT_Image_24_mai_2026_11_10_26.png",
];

export default function StaffApplyPage() {
  const { status, loading } = useAuth();
  const app = STAFF_APPLICATIONS[0];
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [heroImage, setHeroImage] = useState("/media/departments/staff.png");
  const [discordUrl, setDiscordUrl] = useState("#");

  useEffect(() => {
    setHeroImage(STAFF_IMAGES[Math.floor(Math.random() * STAFF_IMAGES.length)]);
    setDiscordUrl(getDiscordLoginUrl());
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading]);

  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-crimson/40 border-t-crimson rounded-full animate-spin" />
      </section>
    );
  }

  if (status.state === "logged_out") {
    return (
      <section className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-display text-4xl fire-text mb-4">Login Required</h1>
          <p className="text-text-muted mb-6">You need to login with Discord to apply.</p>
          <a href={discordUrl} className="px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] rounded-xl text-white font-semibold transition-colors">
            Login with Discord
          </a>
        </div>
      </section>
    );
  }

  if (status.state === "banned") {
    return (
      <section className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="font-display text-4xl text-red-500 mb-4">Account Banned</h1>
          <p className="text-text-muted mb-6">You cannot apply while banned.</p>
          <Link href="/appeal" className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-white font-semibold transition-colors">
            Appeal Ban
          </Link>
        </div>
      </section>
    );
  }

  if (status.state === "whitelisted") {
    const isStaff = "isStaff" in status ? status.isStaff : false;
    if (isStaff) {
      return (
        <section className="min-h-screen flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-crimson/20 border border-crimson/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-crimson" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-display text-4xl fire-text mb-4">Already Staff</h1>
            <p className="text-text-muted mb-6">You are already a staff member.</p>
            <Link href="/" className="px-6 py-3 bg-white/[0.06] hover:bg-white/[0.1] rounded-xl text-text font-semibold transition-colors">
              Back to Home
            </Link>
          </div>
        </section>
      );
    }
    // Whitelisted but not staff — let them apply (fall through to form)
  } else {
    return (
      <section className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="font-display text-4xl fire-text mb-4">Whitelist Required</h1>
          <p className="text-text-muted mb-6">Only whitelisted members can apply for staff positions.</p>
          <Link href="/apply" className="px-6 py-3 bg-white/[0.06] hover:bg-white/[0.1] rounded-xl text-text font-semibold transition-colors">
            Back to Applications
          </Link>
        </div>
      </section>
    );
  }

  if (submitted) {
    return (
      <section className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-crimson/20 border border-crimson/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-crimson" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-4xl fire-text mb-4">Application Submitted</h1>
          <p className="text-text-muted mb-2">Your <span className="text-text font-semibold">{app?.name}</span> application has been submitted.</p>
          <p className="text-text-muted mb-6">Wait for a staff member to review it on Discord.</p>
          <Link href="/apply" className="px-6 py-3 bg-white/[0.06] hover:bg-white/[0.1] rounded-xl text-text font-semibold transition-colors">
            Back to Applications
          </Link>
        </div>
      </section>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/apply/staff_${app?.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        alert(data.error || "Submission failed");
      }
    } catch {
      alert("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  };

  const setField = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-text placeholder:text-text-dim/50 focus:outline-none focus:border-crimson/40 focus:bg-white/[0.06] transition-all text-sm";
  const labelClass = "block text-sm font-medium text-text-muted mb-2";

  return (
    <section ref={ref} className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#050507]" />
        <div className="absolute top-[-20%] left-[10%] w-[700px] h-[600px] bg-crimson/[0.05] rounded-full blur-[160px]" />
        <div className="absolute bottom-[-20%] right-[10%] w-[600px] h-[500px] bg-gold/[0.03] rounded-full blur-[140px]" />
      </div>
      <div className="absolute inset-0 mosaic-pattern pointer-events-none opacity-20" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_20%,#050507_85%)] z-[1]" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-8 py-20 sm:py-28">
        <Link href="/apply" className="inline-flex items-center gap-2 text-text-muted text-sm hover:text-gold transition-colors mb-10">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Applications
        </Link>

        {/* Hero */}
        <div
          className="relative rounded-2xl overflow-hidden border border-white/[0.06] mb-12"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(30px)",
            transition: "all 1s cubic-bezier(0.16,1,0.3,1) 0.1s",
          }}
        >
          <div className="aspect-[21/6] sm:aspect-[3/1]">
            <img src={heroImage} alt="Staff Team" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-10">
            <span className="font-display text-4xl sm:text-5xl md:text-6xl fire-text">Staff Team</span>
            <span className="block text-text-dim text-sm mt-2">Fill out the Staff Team application below.</span>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(30px)",
            transition: "all 1s cubic-bezier(0.16,1,0.3,1) 0.3s",
          }}
        >
          {app?.fields.map((field) => (
            <div key={field.name}>
              <label className={labelClass}>{field.label}</label>
              {field.type === "textarea" ? (
                <textarea
                  required={field.required}
                  rows={3}
                  className={inputClass}
                  placeholder={field.placeholder}
                  value={form[field.name] || ""}
                  onChange={(e) => setField(field.name, e.target.value)}
                />
              ) : field.type === "select" ? (
                <select
                  required={field.required}
                  className={inputClass}
                  value={form[field.name] || ""}
                  onChange={(e) => setField(field.name, e.target.value)}
                >
                  <option value="">Select...</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  required={field.required}
                  className={inputClass}
                  placeholder={field.placeholder}
                  value={form[field.name] || ""}
                  onChange={(e) => setField(field.name, e.target.value)}
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-crimson hover:bg-crimson/80 disabled:opacity-50 text-white font-semibold transition-colors"
          >
            {submitting ? "Submitting..." : `Submit ${app?.name} Application`}
          </button>

          <p className="text-center text-text-dim text-sm pt-2">
            We hope you will be one of us by joining TP staff team.
          </p>
        </form>
      </div>

      <div className="absolute bottom-0 left-0 right-0 fire-line z-20" />
    </section>
  );
}
