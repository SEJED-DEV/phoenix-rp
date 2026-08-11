"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getDiscordLoginUrl } from "@/lib/auth-client";
import { APPLICATION_DEPARTMENTS, type ApplicationDepartment } from "@/lib/applications.data";
import { Skeleton } from "@/components/Skeleton";

function DeptCard({ dept, index }: { dept: ApplicationDepartment; index: number }) {
  const [displayImage, setDisplayImage] = useState(dept.image);

  useEffect(() => {
    const pool = dept.images?.length ? dept.images : [dept.image];
    setDisplayImage(pool[Math.floor(Math.random() * pool.length)]);
  }, [dept]);

  return (
    <Link
      href={`/apply/${dept.slug}`}
      className="group relative rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] hover:border-crimson/30 transition-all duration-500"
    >
      <div className="aspect-[16/9] overflow-hidden">
        <img
          src={displayImage}
          alt={dept.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h3 className="font-display text-2xl sm:text-3xl fire-text mb-1">{dept.name}</h3>
        <p className="text-text-dim text-sm">{dept.description}</p>
        <div className="mt-3 flex items-center gap-2 text-crimson text-xs font-semibold uppercase tracking-wider">
          <span>Apply Now</span>
          <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

export default function ApplyPage() {
  const { status, loading } = useAuth();

  const [discordUrl, setDiscordUrl] = useState("#");

  useEffect(() => {
    setDiscordUrl(getDiscordLoginUrl());
  }, []);

  if (loading) {
    return (
      <section className="relative min-h-screen overflow-hidden px-6 sm:px-8 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-4 w-16 mb-12" />
          <Skeleton className="h-12 sm:h-16 w-72 sm:w-96 mb-4" />
          <Skeleton className="h-5 w-full max-w-xl mb-12" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="aspect-[16/9] rounded-2xl" />
            <Skeleton className="aspect-[16/9] rounded-2xl" />
            <Skeleton className="aspect-[16/9] rounded-2xl" />
          </div>
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

  const user = "user" in status ? status.user : null;
  const hasCheckinRole = status.state === "needs_checkin";
  const isWhitelisted = status.state === "whitelisted";
  const isStaff = "isStaff" in status ? status.isStaff : false;

  const visibleDepts = isWhitelisted
    ? APPLICATION_DEPARTMENTS.filter((d) => d.slug !== "staff")
    : [];

  return (
    <section className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[var(--color-bg)]" />
        <div className="absolute top-[-20%] left-[10%] w-[700px] h-[600px] bg-crimson/[0.04] rounded-full blur-[160px]" />
        <div className="absolute bottom-[-20%] right-[10%] w-[600px] h-[500px] bg-gold/[0.03] rounded-full blur-[140px]" />
      </div>
      <div className="absolute inset-0 mosaic-pattern pointer-events-none opacity-20" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_20%,var(--color-bg)_85%)] z-[1]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 py-20 sm:py-28">
        <div
          style={{
            opacity: 1,
            transform: "translateY(0)",
          }}
        >
          <Link href="/" className="inline-flex items-center gap-2 text-text-muted text-sm hover:text-gold transition-colors mb-12">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>

          <h1 className="font-display text-5xl sm:text-7xl fire-text mb-3">
            {isWhitelisted ? "Department Applications" : "Apply to Phoenix RP"}
          </h1>
          <p className="text-text-muted text-lg max-w-2xl mb-12">
            {isWhitelisted
              ? "Choose a department below to submit your application."
              : "You need to be whitelisted to apply for departments. Apply for staff below to get started."}
          </p>

          {hasCheckinRole && (
            <div className="mb-10 px-5 py-4 rounded-xl border border-gold/30 bg-gold/[0.06] flex items-center gap-3">
              <svg className="w-5 h-5 text-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm text-text">
                You need to <Link href="/checkin" className="text-gold font-semibold hover:underline">check in</Link> via Discord before your application can be reviewed.
              </span>
            </div>
          )}

          {!isWhitelisted && (
            <div className="mt-8 max-w-md">
              <Link
                href="/apply/whitelist"
                className="group block relative rounded-2xl overflow-hidden border border-ember/30 bg-ember/[0.06] p-8 text-center hover:border-ember/50 transition-all duration-500"
              >
                <svg className="w-12 h-12 text-ember mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h3 className="font-display text-2xl fire-text mb-2">Get Whitelisted</h3>
                <p className="text-text-dim text-sm mb-6">Submit your whitelist application to access department applications.</p>
                <span className="inline-flex items-center gap-2 px-6 py-3 bg-crimson hover:bg-crimson/80 rounded-xl text-white font-semibold transition-colors">
                  Apply for Whitelist
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            </div>
          )}
        </div>

          {visibleDepts.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleDepts.map((dept, i) => (
                <DeptCard key={dept.slug} dept={dept} index={i} />
              ))}
            </div>
          )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 fire-line z-20" />
    </section>
  );
}
