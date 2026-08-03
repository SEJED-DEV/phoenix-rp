"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getDiscordLoginUrl } from "@/lib/auth-client";
import PageSkeleton from "@/components/PageSkeleton";

export default function CheckinPage() {
  const { status, loading } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [discordUrl, setDiscordUrl] = useState("#");

  useEffect(() => {
    setDiscordUrl(getDiscordLoginUrl());
  }, []);

  if (loading) {
    return <PageSkeleton />;
  }

  if (status.state === "logged_out") {
    return (
      <section className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-display text-4xl fire-text mb-4">Login Required</h1>
          <p className="text-text-muted mb-6">You need to login with Discord to check in.</p>
          <a href={discordUrl} className="px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] rounded-xl text-white font-semibold transition-colors">
            Login with Discord
          </a>
        </div>
      </section>
    );
  }

  if (status.state !== "needs_checkin") {
    return (
      <section className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="font-display text-4xl fire-text mb-4">No Check-in Required</h1>
          <p className="text-text-muted mb-6">You don&apos;t need to check in at this time.</p>
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
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-4xl fire-text mb-4">Checked In</h1>
          <p className="text-text-muted mb-6">Your check-in has been recorded. You&apos;re all set!</p>
          <Link href="/" className="px-6 py-3 bg-white/[0.06] hover:bg-white/[0.1] rounded-xl text-text font-semibold transition-colors">
            Back to Home
          </Link>
        </div>
      </section>
    );
  }

  const handleCheckin = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkin", { method: "POST" });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        alert(data.error || "Check-in failed");
      }
    } catch {
      alert("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#050507]" />
        <div className="absolute top-[-20%] left-[10%] w-[700px] h-[600px] bg-gold/[0.04] rounded-full blur-[160px]" />
        <div className="absolute bottom-[-20%] right-[10%] w-[600px] h-[500px] bg-crimson/[0.03] rounded-full blur-[140px]" />
      </div>
      <div className="absolute inset-0 mosaic-pattern pointer-events-none opacity-20" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_20%,#050507_85%)] z-[1]" />

      <div className="relative z-10 max-w-lg mx-auto px-6 sm:px-8 py-24 sm:py-32 text-center">
        <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>

        <h1 className="font-display text-5xl sm:text-6xl fire-text mb-4">Check In</h1>
        <p className="text-text-muted text-lg mb-10">
          Confirm your activity to keep your whitelisting status active.
        </p>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 mb-8 text-left">
          <div className="flex items-center gap-3 mb-4">
            <img src={status.user?.avatar} alt={status.user?.username} className="w-10 h-10 rounded-full" />
            <div>
              <span className="text-text font-semibold block">{status.user?.username}</span>
              <span className="text-text-dim text-xs">Discord Account</span>
            </div>
          </div>
          <div className="border-t border-white/[0.06] pt-4">
            <span className="text-text-dim text-sm">By checking in, you confirm that you are still active and wish to maintain your role on the server.</span>
          </div>
        </div>

        <button
          onClick={handleCheckin}
          disabled={submitting}
          className="w-full py-3.5 rounded-xl bg-gold hover:bg-gold/80 disabled:opacity-50 text-black font-semibold transition-colors"
        >
          {submitting ? "Checking in..." : "Check In Now"}
        </button>

        <Link href="/" className="inline-block mt-4 text-text-muted text-sm hover:text-gold transition-colors">
          Skip for now
        </Link>
      </div>

      <div className="absolute bottom-0 left-0 right-0 fire-line z-20" />
    </section>
  );
}
