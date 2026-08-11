"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import FireParticles from "@/components/FireParticles";
import { Skeleton, SkeletonCircle, SkeletonCard } from "@/components/Skeleton";

interface ProfileData {
  username: string;
  avatar: string;
  highestRole: string | null;
  joinedAt: string | null;
  isCreator: boolean;
  profileRoles: { id: string; name: string; color: string }[];
  departments: { name: string; type: "department" | "gang"; color: string }[];
  stats: {
    totalTickets: number;
    openTickets: number;
    inProgressTickets: number;
    closedTickets: number;
  };
}

const ROLE_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  Staff: { bg: "bg-crimson/15", text: "text-crimson", border: "border-crimson/30" },
  Whitelisted: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/25" },
  "Check-in": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/25" },
  Banned: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/25" },
  Blacklisted: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/25" },
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/profile/${userId}`);
        if (res.status === 404) { setError("User not found."); return; }
        if (!res.ok) { setError("Failed to load profile."); return; }
        const data = await res.json();
        setProfile(data);
      } catch {
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pb-24" style={{ paddingTop: "clamp(80px, 12vh, 140px)" }}>
          <Skeleton className="h-4 w-16 mb-8" />
          <SkeletonCard className="p-6 sm:p-8 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <SkeletonCircle className="w-24 h-24" />
              <div className="text-center sm:text-left space-y-2">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </SkeletonCard>
          <Skeleton className="h-3 w-28 mb-3" />
          <div className="flex flex-wrap gap-2 mb-6">
            <Skeleton className="h-7 w-24 rounded-lg" />
            <Skeleton className="h-7 w-28 rounded-lg" />
            <Skeleton className="h-7 w-20 rounded-lg" />
          </div>
          <Skeleton className="h-3 w-24 mb-3" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <section className="h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-display text-4xl fire-text mb-4">{error}</h1>
          <button onClick={() => router.back()} className="mt-4 px-5 py-2.5 rounded-xl border border-white/[0.08] text-text-dim text-sm font-semibold hover:border-white/[0.15] hover:text-text transition-all">
            Go Back
          </button>
        </div>
      </section>
    );
  }

  if (!profile) return null;

  const roleStyle = profile.highestRole ? ROLE_BADGE[profile.highestRole] : null;
  const joinDate = profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : null;
  const isCreator = profile.isCreator;

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[10%] w-[700px] h-[600px] bg-crimson/[0.04] rounded-full blur-[160px]" />
        <div className="absolute bottom-[-20%] right-[10%] w-[600px] h-[500px] bg-gold/[0.03] rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pb-24" style={{ paddingTop: "clamp(80px, 12vh, 140px)" }}>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-text-muted text-sm hover:text-text transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Profile card */}
        <div className={`rounded-2xl overflow-hidden mb-6 ${isCreator ? "creator-card" : "border border-white/[0.08] bg-white/[0.02]"}`}>
          {isCreator && <FireParticles />}
          <div className={`relative p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5 ${isCreator ? "sm:p-12" : ""}`}>
            {isCreator ? (
              <>
                <div className="shrink-0 relative">
                  <div className="absolute inset-0 rounded-full" style={{ background: "conic-gradient(from 0deg, #f59e0b, var(--color-crimson), var(--color-ember), #f59e0b)", padding: 3 }}>
                    <div className="w-full h-full rounded-full bg-[var(--color-bg)]" />
                  </div>
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gold/30">
                    <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-3xl font-semibold fire-text mb-1">{profile.username}</h1>
                  {roleStyle ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}>
                      {profile.highestRole}
                    </span>
                  ) : (
                    <span className="text-xs text-text-muted">Member</span>
                  )}
                  {joinDate && (
                    <p className="text-xs text-text-muted mt-2">Joined {joinDate}</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 border-2 border-white/[0.1]">
                  <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl font-semibold text-text mb-1">{profile.username}</h1>
                  {roleStyle ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}>
                      {profile.highestRole}
                    </span>
                  ) : (
                    <span className="text-xs text-text-muted">Member</span>
                  )}
                  {joinDate && (
                    <p className="text-xs text-text-muted mt-2">Joined {joinDate}</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Creator Bio */}
        {isCreator && (
          <div className="creator-spotlight rounded-2xl p-6 sm:p-8 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-gold" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              <h2 className="font-display text-sm tracking-[0.15em] uppercase text-gold">Built the Website & Bots</h2>
            </div>
            <p className="text-text-dim text-sm leading-relaxed mb-6">
              I&apos;m Sejed Trabelsi — a full-stack developer from Tunisia who started coding at 11. What began as curiosity quickly turned into an obsession with building things that matter.
            </p>
            <p className="text-text-dim text-sm leading-relaxed mb-6">
              Over the past 6+ years, I&apos;ve gone deep into Node.js and Next.js, building everything from high-performance Discord bots serving thousands of users to full-stack web applications with complex backends.
            </p>
            <p className="text-text-dim text-sm leading-relaxed mb-6">
              I believe in clean architecture, scalable systems, and shipping fast. Currently studying while continuing to push the boundaries of what I can build.
            </p>

            <div className="fire-line mb-6" />

            <p className="text-text-muted text-xs uppercase tracking-wider mb-4">Say hello at support@sejed.dev</p>
            <p className="text-text-dim text-sm mb-5">Whether you have a project in mind, a collaboration idea, or just want to say hi — I&apos;ll get back to you fast.</p>

            <div className="flex flex-wrap gap-2">
              <a href="https://sejed.dev" target="_blank" rel="noopener noreferrer" className="creator-social-link">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9 9 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
                Portfolio
              </a>
              <a href="mailto:support@sejed.dev" className="creator-social-link">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                Email
              </a>
              <a href="https://github.com/sejed-dev" target="_blank" rel="noopener noreferrer" className="creator-social-link">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                GitHub
              </a>
              <a href="https://discord.com/users/sejed.dev" target="_blank" rel="noopener noreferrer" className="creator-social-link">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Discord
              </a>
              <a href="https://wa.me/21694155000" target="_blank" rel="noopener noreferrer" className="creator-social-link">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </a>
              <a href="https://instagram.com/http.sejed.official" target="_blank" rel="noopener noreferrer" className="creator-social-link">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
                Instagram
              </a>
            </div>
          </div>
        )}

        {/* Discord Roles */}
        {profile.profileRoles.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display text-sm tracking-[0.15em] uppercase text-text-muted mb-3">Discord Roles</h2>
            <div className="flex flex-wrap gap-2">
              {profile.profileRoles.map((role) => (
                <span
                  key={role.id}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border border-white/[0.08]"
                  style={{ backgroundColor: `${role.color}15`, color: role.color, borderColor: `${role.color}30` }}
                >
                  {role.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Departments & Families */}
        {profile.departments.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display text-sm tracking-[0.15em] uppercase text-text-muted mb-3">
              {profile.departments.some((d) => d.type === "gang") ? "Departments & Families" : "Departments"}
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.departments.map((dept) => (
                <span
                  key={dept.name}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/[0.08]"
                  style={{ backgroundColor: `${dept.color}15`, color: dept.color, borderColor: `${dept.color}30` }}
                >
                  {dept.type === "gang" && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                  {dept.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Activity */}
        <div>
          <h2 className="font-display text-sm tracking-[0.15em] uppercase text-text-muted mb-3">Activity</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 text-center">
              <p className="text-2xl font-semibold text-text">{profile.stats.totalTickets}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Total</p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4 text-center">
              <p className="text-2xl font-semibold text-emerald-400">{profile.stats.openTickets}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Open</p>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4 text-center">
              <p className="text-2xl font-semibold text-amber-400">{profile.stats.inProgressTickets}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">In Progress</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 text-center">
              <p className="text-2xl font-semibold text-text-muted">{profile.stats.closedTickets}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Closed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
