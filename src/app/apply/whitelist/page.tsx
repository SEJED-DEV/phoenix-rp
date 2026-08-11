"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getDiscordLoginUrl } from "@/lib/auth-client";
import { WHITELIST_FIELDS, type ApplicationField } from "@/lib/applications.data";
import FormFields from "@/components/FormFields";
import PageSkeleton from "@/components/PageSkeleton";

const WHITELIST_IMAGES = [
  "/media/ChatGPT_Image_22_juin_2026_02_02_52.png",
  "/media/ChatGPT_Image_22_juin_2026_02_23_43.png",
  "/media/ChatGPT_Image_24_mai_2026_11_10_26.png",
];

export default function WhitelistApplyPage() {
  const { status, loading } = useAuth();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [fields, setFields] = useState<ApplicationField[]>(WHITELIST_FIELDS);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [heroImage, setHeroImage] = useState(WHITELIST_IMAGES[0]);
  const [discordUrl, setDiscordUrl] = useState("#");

  useEffect(() => {
    setHeroImage(WHITELIST_IMAGES[Math.floor(Math.random() * WHITELIST_IMAGES.length)]);
    setDiscordUrl(getDiscordLoginUrl());
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/apply/questions?dept=whitelist")
      .then((r) => (r.ok ? r.json() : null))
      .then((q: ApplicationField[] | null) => {
        if (!cancelled && q) setFields(q);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
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
    return <PageSkeleton />;
  }

  if (status.state === "logged_out") {
    return (
      <section className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-display text-4xl fire-text mb-4">Login Required</h1>
          <p className="text-text-muted mb-6">You need to login with Discord to apply for whitelist.</p>
          <a href={discordUrl} className="px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] rounded-xl text-white font-semibold transition-colors">
            Login with Discord
          </a>
        </div>
      </section>
    );
  }

  if (status.state === "whitelisted") {
    return (
      <section className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-crimson/20 border border-crimson/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-crimson" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-4xl fire-text mb-4">Already Whitelisted</h1>
          <p className="text-text-muted mb-6">You already have whitelist access. Head to department applications.</p>
          <Link href="/apply" className="px-6 py-3 bg-white/[0.06] hover:bg-white/[0.1] rounded-xl text-text font-semibold transition-colors">
            Department Applications
          </Link>
        </div>
      </section>
    );
  }

  if (status.state === "blacklisted") {
    return (
      <section className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-600/20 border border-red-600/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h1 className="font-display text-4xl text-red-500 mb-4">Permanently Blacklisted</h1>
          <p className="text-text-muted mb-6">You have been permanently blacklisted. Open a ticket on Discord to appeal.</p>
          <Link href="/" className="px-6 py-3 bg-white/[0.06] hover:bg-white/[0.1] rounded-xl text-text font-semibold transition-colors">
            Back to Home
          </Link>
        </div>
      </section>
    );
  }

  if (status.state === "banned") {
    return (
      <section className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-600/20 border border-red-600/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h1 className="font-display text-4xl text-red-500 mb-4">Account Banned</h1>
          <p className="text-text-muted mb-6">You cannot apply while banned. Appeal your ban first.</p>
          <Link href="/appeal" className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-white font-semibold transition-colors">
            Appeal Ban
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
          <p className="text-text-muted mb-2">Your whitelist application has been submitted.</p>
          <p className="text-text-muted mb-6">Wait for a staff member to review it on Discord.</p>
          <Link href="/" className="px-6 py-3 bg-white/[0.06] hover:bg-white/[0.1] rounded-xl text-text font-semibold transition-colors">
            Back to Home
          </Link>
        </div>
      </section>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/apply/whitelist", {
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

  return (
    <section ref={ref} className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[var(--color-bg)]" />
        <div className="absolute top-[-20%] left-[10%] w-[700px] h-[600px] bg-crimson/[0.05] rounded-full blur-[160px]" />
        <div className="absolute bottom-[-20%] right-[10%] w-[600px] h-[500px] bg-gold/[0.03] rounded-full blur-[140px]" />
      </div>
      <div className="absolute inset-0 mosaic-pattern pointer-events-none opacity-20" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_20%,var(--color-bg)_85%)] z-[1]" />

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
            <img src={heroImage} alt="Whitelist Application" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)]/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-10">
            <span className="font-display text-4xl sm:text-5xl md:text-6xl fire-text">Whitelist Application</span>
            <span className="block text-text-dim text-sm mt-2">Apply to get whitelist access and join the city.</span>
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
          {fields.length === 0 ? (
            <p className="text-text-muted text-sm">No questions configured yet — try again later.</p>
          ) : (
            <FormFields fields={fields} form={form} setField={setField} />
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-crimson hover:bg-crimson/80 disabled:opacity-50 text-white font-semibold transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Whitelist Application"}
          </button>
        </form>
      </div>

      <div className="absolute bottom-0 left-0 right-0 fire-line z-20" />
    </section>
  );
}
