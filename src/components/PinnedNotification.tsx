"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

const DISCORD_INVITE = "#"; // TODO: Replace with real invite link

const CONFIGS = {
  not_in_server: {
    gradient: "from-crimson/30 via-crimson/15 to-transparent",
    border: "border-crimson/25",
    icon: (
      <svg className="w-5 h-5 text-crimson shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    text: "Join our Discord server to get started",
    action: { label: "Join Discord", href: DISCORD_INVITE, external: true },
  },
  needs_apply: {
    gradient: "from-ember/30 via-ember/15 to-transparent",
    border: "border-ember/25",
    icon: (
      <svg className="w-5 h-5 text-ember shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    text: "You need to apply before joining the server",
    action: { label: "Apply Now", href: "/apply", external: false },
  },
  needs_checkin: {
    gradient: "from-gold/30 via-gold/15 to-transparent",
    border: "border-gold/25",
    icon: (
      <svg className="w-5 h-5 text-gold shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    text: "You need to check in to keep your role",
    action: { label: "Check In", href: "/checkin", external: false },
  },
  banned: {
    gradient: "from-red-600/30 via-red-600/15 to-transparent",
    border: "border-red-600/25",
    icon: (
      <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    text: "Your account has been banned",
    action: { label: "Appeal Ban", href: "/appeal", external: false },
  },
  blacklisted: {
    gradient: "from-red-600/30 via-red-600/15 to-transparent",
    border: "border-red-600/25",
    icon: (
      <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    text: "Your account has been permanently blacklisted",
    action: null,
  },
};

export default function PinnedNotification() {
  const { status, loading } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  const shouldShow = !loading && status.state !== "logged_out" && status.state !== "whitelisted";
  const config = shouldShow ? CONFIGS[status.state as keyof typeof CONFIGS] : undefined;

  useEffect(() => {
    if (shouldShow && config && !dismissed) {
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    }
  }, [shouldShow, config, dismissed]);

  if (!shouldShow || !config || dismissed) return null;

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => setDismissed(true), 300);
  };

  return (
    <div
      className={`fixed left-0 right-0 top-14 lg:top-16 z-[55] transition-all duration-300 ease-out ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      <div
        className={`w-full border-b bg-gradient-to-r backdrop-blur-md ${config.gradient} ${config.border}`}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-3 min-w-0">
            {config.icon}
            <span className="text-sm text-text font-medium truncate">{config.text}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {config.action && (
              <Link
                href={config.action.href}
                target={config.action.external ? "_blank" : undefined}
                rel={config.action.external ? "noopener noreferrer" : undefined}
                className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-white/[0.1] hover:bg-white/[0.18] text-text transition-colors"
              >
                {config.action.label}
              </Link>
            )}
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg hover:bg-white/[0.1] text-text-muted hover:text-text transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
