"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getDiscordLoginUrl } from "@/lib/auth-client";
import { getDepartment, type ApplicationField } from "@/lib/applications.data";
import FormFields from "@/components/FormFields";
import PageSkeleton from "@/components/PageSkeleton";
import { useSiteBrand } from "@/contexts/SiteBrandContext";

export default function DeptApplyPage() {
  const params = useParams();
  const deptSlug = params.dept as string;
  const dept = getDepartment(deptSlug);
  const { status, loading } = useAuth();
  const { branding } = useSiteBrand();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [fields, setFields] = useState<ApplicationField[]>(dept?.fields || []);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [heroImage, setHeroImage] = useState(dept?.image || "");
  const [discordUrl, setDiscordUrl] = useState("#");

  useEffect(() => {
    setDiscordUrl(getDiscordLoginUrl());
  }, []);

  useEffect(() => {
    if (dept?.images?.length) {
      setHeroImage(dept.images[Math.floor(Math.random() * dept.images.length)]);
    }
  }, [dept]);

  useEffect(() => {
    if (!deptSlug) return;
    let cancelled = false;
    fetch(`/api/apply/questions?dept=${encodeURIComponent(deptSlug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((q: ApplicationField[] | null) => {
        if (!cancelled && q) setFields(q);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [deptSlug]);

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

  if (!dept) {
    return (
      <section className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-display text-4xl fire-text mb-4">Department Not Found</h1>
          <p className="text-text-muted mb-6">This department doesn&apos;t exist.</p>
          <Link href="/apply" className="px-6 py-3 bg-white/[0.06] hover:bg-white/[0.1] rounded-xl text-text font-semibold transition-colors">
            Back to Applications
          </Link>
        </div>
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

  if (status.state === "whitelisted" && !dept.roleAccess.includes("1533959429697966233")) {
    return (
      <section className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-crimson/20 border border-crimson/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-crimson" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.893 13.393l-3.536 3.536-.75.75a1.5 1.5 0 01-2.12 0L12 15.503l-2.478 2.478a1.5 1.5 0 01-2.121 0l-.75-.75-3.536-3.536a1.5 1.5 0 010-2.121l2.478-2.478L3.5 9.136a1.5 1.5 0 010-2.12l3.536-3.536.75-.75a1.5 1.5 0 012.12 0L12 6.497l2.478-2.478a1.5 1.5 0 012.121 0l.75.75 3.536 3.536a1.5 1.5 0 010 2.12L17.5 11.995l-2.478 2.478a1.5 1.5 0 000 2.121z" />
            </svg>
          </div>
          <h1 className="font-display text-4xl fire-text mb-4">Join the Discord Server</h1>
          <p className="text-text-muted mb-6">To apply for {dept.name}, join our Discord server first.</p>
          <a href={branding.discordInvite} target="_blank" rel="noopener noreferrer" className="inline-block px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] rounded-xl text-white font-semibold transition-colors">
            Join Discord Server
          </a>
          <div className="mt-5">
            <Link href="/apply" className="text-text-muted hover:text-gold transition-colors text-sm">
              Back to Applications
            </Link>
          </div>
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
          <p className="text-text-muted mb-6">You cannot submit applications while banned. Appeal first.</p>
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
          <p className="text-text-muted mb-2">Your <span className="text-text font-semibold">{dept.name}</span> application has been submitted.</p>
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
      const res = await fetch(`/api/apply/${deptSlug}`, {
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
            <img src={heroImage} alt={dept.name} className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)]/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-10">
            <span className="font-display text-4xl sm:text-5xl md:text-6xl fire-text">{dept.name}</span>
            <span className="block text-text-dim text-sm mt-2">{dept.description}</span>
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
            {submitting ? "Submitting..." : `Submit ${dept.name}`}
          </button>
        </form>
      </div>

      <div className="absolute bottom-0 left-0 right-0 fire-line z-20" />
    </section>
  );
}
