"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-bg relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-bg" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[200px]" style={{ background: "color-mix(in srgb, var(--color-crimson) 6%, transparent)" }} />
      </div>

      <div className="relative z-10 text-center">
        {/* 404 */}
        <h1
          className="font-display leading-none tracking-[0.02em] fire-text"
          style={{ fontSize: "clamp(6rem, 20vw, 14rem)", animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both" }}
        >
          404
        </h1>

        {/* Divider */}
        <div
          className="w-24 h-px mx-auto my-6"
          style={{ background: "linear-gradient(90deg, transparent, var(--color-crimson), transparent)", animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both" }}
        />

        {/* Message */}
        <p
          className="font-display tracking-[0.2em] uppercase text-text-muted mb-2"
          style={{ fontSize: 14, animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s both" }}
        >
          Page Not Found
        </p>
        <p
          className="text-text-muted mb-10"
          style={{ fontSize: 13, animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.25s both" }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* CTA */}
        <Link
          href="/"
          className="hero-btn-primary inline-flex"
          style={{ animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.3s both" }}
        >
          <span className="hero-btn-inner">
            <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span>BACK HOME</span>
          </span>
        </Link>
      </div>
    </div>
  );
}
