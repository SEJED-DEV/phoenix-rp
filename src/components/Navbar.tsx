"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteBrand } from "@/contexts/SiteBrandContext";
import { getDiscordLoginUrl } from "@/lib/auth-client";
import Link from "next/link";

interface NavItem {
  label: string;
  href: string;
}

interface DropdownGroup {
  label: string;
  items: NavItem[];
}

const groups: DropdownGroup[] = [
  {
    label: "Explore",
    items: [
      { label: "Departments", href: "/departments" },
      { label: "Rules", href: "/rules" },
      { label: "Storyline", href: "/storyline" },
    ],
  },
  {
    label: "Media",
    items: [
      { label: "Gallery", href: "/gallery" },
      { label: "Streamers", href: "/streamers" },
      { label: "Shop", href: "/shop" },
    ],
  },
  {
    label: "Support",
    items: [
      { label: "FAQ", href: "/faq" },
      { label: "Tickets", href: "/tickets" },
    ],
  },
];

const mobileGroups = groups;

export default function Navbar() {
  const { status, loading } = useAuth();
  const { branding } = useSiteBrand();
  const [open, setOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isHome, setIsHome] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [discordUrl, setDiscordUrl] = useState("#");
  const [active, setActive] = useState("");
  const navRef = useRef<HTMLElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isLoggedIn = !loading && status.state !== "logged_out";
  const user = "user" in status ? status.user : null;
  const isStaff = "isStaff" in status ? status.isStaff : false;

  useEffect(() => {
    setDiscordUrl(getDiscordLoginUrl());
  }, []);

  useEffect(() => {
    const path = window.location.pathname;
    setIsHome(path === "/");
    if (path === "/departments") setActive("/departments");
    else if (path === "/rules") setActive("/rules");
    else if (path === "/faq") setActive("/faq");
    else if (path === "/shop") setActive("/shop");
    else if (path === "/gallery") setActive("/gallery");
    else if (path === "/storyline") setActive("/storyline");
    else if (path === "/tickets") setActive("/tickets");
    else if (path === "/staff") setActive("/staff");
    else if (path === "/streamers") setActive("/streamers");
    else setActive("");
  }, []);

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

  useEffect(() => {
    if (!activeDropdown) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      for (const key of Object.keys(dropdownRefs.current)) {
        if (dropdownRefs.current[key]?.contains(target)) return;
      }
      setActiveDropdown(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [activeDropdown]);

  const isActive = (href: string) => {
    if (href === "/gallery" && active === "/gallery") return true;
    if (href === "/streamers" && active === "/streamers") return true;
    return active === href;
  };

  const isGroupActive = (group: DropdownGroup) => group.items.some((it) => isActive(it.href));

  const DropdownIcon = () => (
    <svg className="w-3 h-3 opacity-40 transition-transform group-data-[open=true]:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );

  return (
    <>
      {/* ── DESKTOP NAV ── */}
      <nav
        ref={navRef}
        className="hidden lg:block fixed top-0 left-0 right-0 z-50"
        style={{
          height: 64,
          background: "color-mix(in srgb, var(--color-bg) 90%, transparent)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <img src="/api/site/logo" alt="Logo" style={{ width: 32, height: 32, objectFit: "contain" }} />
            <span className="nav-logo-text">{branding.siteName}</span>
          </a>

          {/* Links */}
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <a href="/" className={`nav-link ${active === "" && isHome ? "active" : ""}`}>
              Home
            </a>
            <a href="/#about" className={`nav-link ${active === "#about" ? "active" : ""}`}>
              About
            </a>

            {groups.map((g) => (
              <div
                key={g.label}
                ref={(el) => { dropdownRefs.current[g.label] = el; }}
                className="relative"
                onMouseEnter={() => setActiveDropdown(g.label)}
                onMouseLeave={() => setActiveDropdown(null)}
                data-open={activeDropdown === g.label}
              >
                <button
                  className={`nav-link group flex items-center gap-1.5 ${isGroupActive(g) ? "active" : ""}`}
                  onClick={() => setActiveDropdown(activeDropdown === g.label ? null : g.label)}
                >
                  {g.label}
                  <DropdownIcon />
                </button>
                {activeDropdown === g.label && (
                  <div className="absolute top-full left-0 pt-2 z-50">
                    <div
                      className="w-48 py-2 rounded-xl border border-white/[0.08] bg-[#0c0c10]/95 backdrop-blur-xl shadow-2xl"
                      style={{ animation: "fadeIn 0.15s ease-out" }}
                    >
                      {g.items.map((it) => (
                        <a
                          key={it.href}
                          href={it.href}
                          className={`flex items-center px-4 py-2.5 text-sm transition-colors ${isActive(it.href) ? "text-white bg-white/[0.06]" : "text-text-muted hover:text-white hover:bg-white/[0.04]"}`}
                        >
                          {it.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <a href="/staff" className={`nav-link ${active === "/staff" ? "active" : ""}`}>
              Staff
            </a>

            {/* Divider */}
            <div className="w-px h-5 bg-white/[0.08] mx-2" />

            {/* Auth */}
            {isLoggedIn && user ? (
              <div ref={userMenuRef} className="relative">
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
                  <div className="absolute right-0 top-full mt-2 w-48 py-2 rounded-xl border border-white/[0.08] bg-[#0c0c10]/95 backdrop-blur-xl shadow-2xl" style={{ animation: "fadeIn 0.15s ease-out" }}>
                    <div className="px-4 py-2 border-b border-white/[0.06]">
                      <span className="text-xs text-text-muted">Signed in as</span>
                      <span className="block text-sm font-medium text-text truncate">{user.username}</span>
                    </div>
                    <a href={`/profile/${user.id}`} className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-muted hover:text-text hover:bg-white/[0.04] transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile
                    </a>
                    {isStaff && (
                      <a href="/staff-panel" className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-muted hover:text-crimson hover:bg-white/[0.04] transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Staff Panel
                      </a>
                    )}
                    {isStaff && (
                      <a href="/staff-panel/docs" className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-muted hover:text-crimson hover:bg-white/[0.04] transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Staff Docs
                      </a>
                    )}
                    <a href="/api/auth/logout" className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-muted hover:text-crimson hover:bg-white/[0.04] transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <a href={discordUrl} className="discord-login-btn">
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
          background: "color-mix(in srgb, var(--color-bg) 90%, transparent)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ padding: "0 16px", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <img src="/api/site/logo" alt="Logo" style={{ width: 28, height: 28, objectFit: "contain" }} />
            <span className="nav-logo-text" style={{ fontSize: 16 }}>{branding.siteName}</span>
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
          <a href="/" onClick={() => setOpen(false)} className={`mobile-bottom-link ${isHome ? "active" : ""}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
            </svg>
            <span>Home</span>
          </a>
          <a href="/departments" onClick={() => setOpen(false)} className={`mobile-bottom-link ${active === "/departments" ? "active" : ""}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>Depts</span>
          </a>
          <a href="/tickets" onClick={() => setOpen(false)} className={`mobile-bottom-link ${active === "/tickets" ? "active" : ""}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Tickets</span>
          </a>
          <a href="/gallery" onClick={() => setOpen(false)} className={`mobile-bottom-link ${active === "/gallery" ? "active" : ""}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Gallery</span>
          </a>
        </div>
      </nav>

      {/* ── MOBILE OVERLAY MENU ── */}
      <div className={`nav-mobile-overlay lg:hidden ${open ? "visible" : "hidden"}`}>
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8">
          <nav>
            <a href="/" onClick={() => setOpen(false)} className="nav-mobile-link">
              <span className="nav-mobile-num">01</span>Home
            </a>
            <a href="/#about" onClick={() => setOpen(false)} className="nav-mobile-link">
              <span className="nav-mobile-num">02</span>About
            </a>

            {mobileGroups.map((g, gi) => (
              <div key={g.label}>
                <div className="pt-6 pb-2">
                  <span className="text-[10px] font-display tracking-[0.25em] uppercase text-text-muted/40">{g.label}</span>
                </div>
                {g.items.map((it, ii) => (
                  <a
                    key={it.href}
                    href={it.href}
                    onClick={() => setOpen(false)}
                    className={`nav-mobile-link ${isActive(it.href) ? "active" : ""}`}
                  >
                    <span className="nav-mobile-num">{String(gi * 3 + ii + 3).padStart(2, "0")}</span>
                    {it.label}
                  </a>
                ))}
              </div>
            ))}

            <div className="pt-6 pb-2">
              <span className="text-[10px] font-display tracking-[0.25em] uppercase text-text-muted/40">Admin</span>
            </div>
            <a href="/staff" onClick={() => setOpen(false)} className={`nav-mobile-link ${active === "/staff" ? "active" : ""}`}>
              <span className="nav-mobile-num">10</span>Staff
            </a>
          </nav>

          <div className="mt-10 pt-6 border-t border-white/[0.06]">
            {isLoggedIn && user ? (
              <div>
                <a href={`/profile/${user.id}`} onClick={() => setOpen(false)} className="nav-mobile-link">
                  <span className="nav-mobile-num">&bull;</span>Profile
                </a>
                {isStaff && (
                  <a href="/staff-panel" onClick={() => setOpen(false)} className="nav-mobile-link">
                    <span className="nav-mobile-num">&bull;</span>Staff Panel
                  </a>
                )}
                {isStaff && (
                  <a href="/staff-panel/docs" onClick={() => setOpen(false)} className="nav-mobile-link">
                    <span className="nav-mobile-num">&bull;</span>Staff Docs
                  </a>
                )}
                <a href="/api/auth/logout" className="nav-mobile-link">
                  <span className="nav-mobile-num">&bull;</span>Logout
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
