"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getDiscordLoginUrl } from "@/lib/auth-client";
import { APPEAL_FIELDS, type ApplicationField } from "@/lib/applications.data";
import FormFields from "@/components/FormFields";
import PageSkeleton from "@/components/PageSkeleton";

export default function AppealPage() {
  const { status, loading } = useAuth();
  const [form, setForm] = useState<Record<string, string>>({
    discordTag: "",
    reason: "",
    additionalInfo: "",
  });
  const [fields, setFields] = useState<ApplicationField[]>(APPEAL_FIELDS);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [discordUrl, setDiscordUrl] = useState("#");

  useEffect(() => {
    setDiscordUrl(getDiscordLoginUrl());
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/apply/questions?dept=ban-appeal")
      .then((r) => (r.ok ? r.json() : null))
      .then((q: ApplicationField[] | null) => {
        if (!cancelled && q) setFields(q);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <PageSkeleton />;
  }

  if (status.state === "logged_out") {
    return (
      <section className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-display text-4xl fire-text mb-4">Login Required</h1>
          <p className="text-text-muted mb-6">You need to login with Discord to appeal.</p>
          <a href={discordUrl} className="px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] rounded-xl text-white font-semibold transition-colors">
            Login with Discord
          </a>
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
          <p className="text-text-muted mb-6">Your account has been permanently blacklisted. This cannot be appealed.</p>
          <Link href="/" className="px-6 py-3 bg-white/[0.06] hover:bg-white/[0.1] rounded-xl text-text font-semibold transition-colors">
            Back to Home
          </Link>
        </div>
      </section>
    );
  }

  if (status.state !== "banned") {
    return (
      <section className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-crimson/20 border border-crimson/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-crimson" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-4xl fire-text mb-4">Not Banned</h1>
          <p className="text-text-muted mb-6">Your account is not banned. No appeal needed.</p>
          <Link href="/" className="px-6 py-3 bg-white/[0.06] hover:bg-white/[0.1] rounded-xl text-text font-semibold transition-colors">
            Back to Home
          </Link>
        </div>
      </section>
    );
  }

  if (submitted) {
    return (
      <section className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-600/20 border border-red-600/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-4xl text-red-500 mb-4">Appeal Submitted</h1>
          <p className="text-text-muted mb-2">Your ban appeal has been received.</p>
          <p className="text-text-muted mb-6">A staff member will review it on Discord.</p>
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
      const res = await fetch("/api/apply/ban-appeal", {
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
    <section className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[var(--color-bg)]" />
        <div className="absolute top-[-20%] left-[10%] w-[700px] h-[600px] bg-red-600/[0.04] rounded-full blur-[160px]" />
        <div className="absolute bottom-[-20%] right-[10%] w-[600px] h-[500px] bg-crimson/[0.03] rounded-full blur-[140px]" />
      </div>
      <div className="absolute inset-0 mosaic-pattern pointer-events-none opacity-20" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_20%,var(--color-bg)_85%)] z-[1]" />

      <div className="relative z-10 max-w-2xl mx-auto px-6 sm:px-8 py-20 sm:py-28">
        <Link href="/" className="inline-flex items-center gap-2 text-text-muted text-sm hover:text-gold transition-colors mb-10">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        <h1 className="font-display text-5xl sm:text-6xl text-red-500 mb-3">Appeal Your Ban</h1>
        <p className="text-text-muted mb-10">Fill out the form below to appeal your ban. Be honest and provide as much detail as possible.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {fields.length === 0 ? (
            <p className="text-text-muted text-sm">No questions configured yet — try again later.</p>
          ) : (
            <FormFields fields={fields} form={form} setField={setField} textareaRows={3} />
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Appeal"}
          </button>
        </form>
      </div>

      <div className="absolute bottom-0 left-0 right-0 fire-line z-20" />
    </section>
  );
}
