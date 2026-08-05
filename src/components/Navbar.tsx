"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getDiscordLoginUrl } from "@/lib/auth-client";
import Link from "next/link";

const links = [
  { label: "Home", href: "#home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" },
  { label: "About", href: "#about", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Depts", href: "/departments", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  { label: "Rules", href: "/rules", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  { label: "Storyline", href: "/storyline", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { label: "Tickets", href: "/tickets", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { label: "FAQ", href: "/faq", icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Staff", href: "/staff", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
];

const bottomLinks = [
  { label: "Home", href: "#home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" },
  { label: "Depts", href: "/departments", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  { label: "Tickets", href: "/tickets", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { label: "Gallery", href: "/gallery", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
];

export default function Navbar() {
  const { status, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("#home");
  const [isHome, setIsHome] = useState(true);
  const [isGallery, setIsGallery] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [discordUrl, setDiscordUrl] = useState("#");
  const navRef = useRef<HTMLElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = !loading && status.state !== "logged_out";
  const user = "user" in status ? status.user : null;
  const isStaff = "isStaff" in status ? status.isStaff : false;

  useEffect(() => {
    setDiscordUrl(getDiscordLoginUrl());
  }, []);

  useEffect(() => {
    const path = window.location.pathname;
    setIsHome(path === "/");
    setIsGallery(path === "/gallery");
    if (path !== "/") {
      if (path === "/departments") setActive("/departments");
      else if (path === "/rules") setActive("/rules");
      else if (path === "/faq") setActive("/faq");
      else if (path === "/gallery") setActive("/gallery");
      else if (path === "/storyline") setActive("/storyline");
      else if (path === "/tickets") setActive("/tickets");
      else if (path === "/staff") setActive("/staff");
      else setActive("");
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
      if (!isHome) return;
      const sections = ["home", "about"];
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.getBoundingClientRect().top <= 120) {
          setActive("#" + sections[i]);
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  const navHref = (href: string) => {
    if (href.startsWith("/")) return href;
    return isHome ? href : `/${href}`;
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!showUserMenu) return;
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showUserMenu]);

  return (
    <>
      {/* ── DESKTOP NAV ── */}
      <nav
        ref={navRef}
        className="hidden lg:block fixed top-0 left-0 right-0 z-50"
        style={{
          height: 64,
          background: "rgba(5, 5, 7, 0.9)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href={navHref("#home")} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <img src="/logo.png" alt="Logo" style={{ width: 32, height: 32, objectFit: "contain" }} />
            <span className="nav-logo-text">TUNISIAN PHOENIX</span>
          </a>

          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {links.map((l) => (
              <a key={l.href} href={navHref(l.href)} className={`nav-link ${active === l.href ? "active" : ""}`}>
                {l.label}
              </a>
            ))}
            <a href="/gallery" className={`nav-link ${isGallery ? "active" : ""}`}>Gallery</a>
            {isLoggedIn && user ? (
              <div ref={userMenuRef} className="relative" style={{ marginLeft: 12 }}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
                >
                  <img src={user.avatar} alt={user.username} className="w-7 h-7 rounded-full" />
                  <span className="text-sm text-text font-medium">{user.username}</span>
                  <svg className={`w-3.5 h-3.5 text-text-muted transition-transform ${showUserMenu ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 py-2 rounded-xl border border-white/[0.08] bg-[#0c0c10]/95 backdrop-blur-xl shadow-2xl">
                    <div className="px-4 py-2 border-b border-white/[0.06]">
                      <span className="text-xs text-text-muted">Signed in as</span>
                      <span className="block text-sm font-medium text-text truncate">{user.username}</span>
                    </div>
                    <a
                      href={`/profile/${user.id}`}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-text-muted hover:text-text hover:bg-white/[0.04] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile
                    </a>
                    {isStaff && (
                      <a
                        href="/staff-panel"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-text-muted hover:text-crimson hover:bg-white/[0.04] transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Staff Panel
                      </a>
                    )}
                    {isStaff && (
                      <a
                        href="/staff-panel/docs"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-text-muted hover:text-crimson hover:bg-white/[0.04] transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Staff Docs
                      </a>
                    )}
                    <a href="/api/auth/logout" className="flex items-center gap-2 px-4 py-2 text-sm text-text-muted hover:text-crimson hover:bg-white/[0.04] transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <a
                href={discordUrl}
                className="discord-login-btn"
                style={{ marginLeft: 12 }}
              >
                <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                <span>Discord Login</span>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* ── MOBILE TOP BAR ── */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-50"
        style={{
          height: 56,
          background: "rgba(5, 5, 7, 0.9)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ padding: "0 16px", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href={navHref("#home")} style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <img src="/logo.png" alt="Logo" style={{ width: 28, height: 28, objectFit: "contain" }} />
            <span className="nav-logo-text" style={{ fontSize: 16 }}>TUNISIAN PHOENIX</span>
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isLoggedIn && user ? (
              <Link href={`/profile/${user.id}`} className="flex items-center">
                <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full border border-white/[0.1]" />
              </Link>
            ) : (
              <a href={discordUrl} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] transition-colors">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                <span className="text-xs text-white font-medium">Login</span>
              </a>
            )}
            <button
              onClick={() => setOpen(!open)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/[0.08] text-text-muted hover:text-text hover:border-white/[0.15] transition-colors"
            >
              {open ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 mobile-bottom-nav">
        <div className="mobile-bottom-nav-inner">
          {bottomLinks.map((l) => (
            <a
              key={l.href}
              href={navHref(l.href)}
              onClick={() => setOpen(false)}
              className={`mobile-bottom-link ${active === l.href ? "active" : ""}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={l.icon} />
              </svg>
              <span>{l.label}</span>
            </a>
          ))}
        </div>
      </nav>

      {/* ── MOBILE OVERLAY MENU ── */}
      <div className={`nav-mobile-overlay lg:hidden ${open ? "visible" : "hidden"}`}>
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8">
          <nav>
            {[...links, { label: "Gallery", href: "/gallery", icon: "" }].map((l, i) => (
              <a
                key={l.href}
                href={navHref(l.href)}
                onClick={() => setOpen(false)}
                className={`nav-mobile-link ${active === l.href || (l.href === "/gallery" && isGallery) ? "active" : ""}`}
              >
                <span className="nav-mobile-num">{String(i + 1).padStart(2, "0")}</span>
                {l.label}
              </a>
            ))}
          </nav>

          <div className="mt-10 pt-6 border-t border-white/[0.06]">
            {isLoggedIn && user ? (
              <div>
                <a href={`/profile/${user.id}`} onClick={() => setOpen(false)} className="nav-mobile-link">
                  <span className="nav-mobile-num">•</span>
                  Profile
                </a>
                {isStaff && (
                  <a href="/staff-panel" onClick={() => setOpen(false)} className="nav-mobile-link">
                    <span className="nav-mobile-num">•</span>
                    Staff Panel
                  </a>
                )}
                {isStaff && (
                  <a href="/staff-panel/docs" onClick={() => setOpen(false)} className="nav-mobile-link">
                    <span className="nav-mobile-num">•</span>
                    Staff Docs
                  </a>
                )}
                <a href="/api/auth/logout" className="nav-mobile-link">
                  <span className="nav-mobile-num">•</span>
                  Logout
                </a>
              </div>
            ) : (
              <a href={discordUrl} onClick={() => setOpen(false)} className="discord-login-btn">
                <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                <span>Discord Login</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
