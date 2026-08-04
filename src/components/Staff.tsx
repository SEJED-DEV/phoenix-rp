"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getProfileRoles, PROFILE_ROLES } from "@/lib/profile-roles.config";
import { Skeleton, SkeletonCircle, SkeletonCard } from "@/components/Skeleton";

interface StaffMember {
  userId: string;
  username: string;
  avatar: string;
  roles: string[];
}

const STAFF_ROLE_GROUPS = [
  {
    label: "Leadership",
    roleIds: ["985444871722631199", "1471841519970287789", "1504840040424018123"],
    description: "The visionaries behind the server",
    accent: "#f59e0b",
  },
  {
    label: "Development",
    roleIds: ["1507135880824094751"],
    description: "Building and maintaining the platform",
    accent: "#3b82f6",
  },
  {
    label: "Management",
    roleIds: [
      "1504840052654735390", "1504840056333144246", "1504840058174443582",
      "1504850103154901014", "1504850107848331365",
    ],
    description: "Keeping everything running smoothly",
    accent: "#dc2626",
  },
  {
    label: "Staff Team",
    roleIds: [
      "1504840067498250383", // Admin
      "1504840068798480618", // Admin Under Test
      "1505998312669446144", // Media Manager
      "1504840075945443513", // Staff Team
      "1504840072267038721", // Support Team
      "1504840060233842739", // Whitelister
      "1504840074377035927", // PC Checker
    ],
    description: "Enforcing the rules and supporting the community",
    accent: "#06b6d4",
  },
];

function getOtherRoles(memberRoles: string[], primaryRoleId: string): { id: string; name: string; color: string }[] {
  return PROFILE_ROLES
    .filter((r) => memberRoles.includes(r.id) && r.id !== primaryRoleId)
    .slice(0, 3);
}

function StaffCard({ member, accent, onClick }: { member: StaffMember; accent: string; onClick: () => void }) {
  const profileRoles = getProfileRoles(member.roles);
  const primaryRole = profileRoles[0];
  const otherRoles = primaryRole ? getOtherRoles(member.roles, primaryRole.id) : [];

  return (
    <button
      onClick={onClick}
      className="group relative p-5 rounded-2xl text-center transition-all duration-500 ease-out cursor-pointer border border-white/[0.04] hover:border-white/[0.1]"
      style={{
        background: "linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
      }}
    >
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${accent}12 0%, transparent 70%)`,
        }}
      />
      <div className="relative z-10">
        <div className="relative w-16 h-16 mx-auto mb-3">
          <div
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ boxShadow: `0 0 24px ${accent}30` }}
          />
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 transition-all duration-500" style={{ borderColor: `${accent}25` }}>
            <img src={member.avatar} alt={member.username} className="w-full h-full object-cover" />
          </div>
        </div>
        <h3 className="font-display text-sm tracking-wider mb-1 text-text group-hover:text-white transition-colors duration-300">
          {member.username}
        </h3>
        {primaryRole && (
          <p className="text-[10px] tracking-widest font-semibold uppercase mb-1.5" style={{ color: primaryRole.color }}>
            {primaryRole.name}
          </p>
        )}
        {otherRoles.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1 mt-2">
            {otherRoles.map((r) => (
              <span
                key={r.id}
                className="text-[8px] px-1.5 py-0.5 rounded-full border uppercase tracking-wider"
                style={{ borderColor: `${r.color}18`, backgroundColor: `${r.color}08`, color: `${r.color}cc` }}
              >
                {r.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}


export default function Staff() {
  const router = useRouter();
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await fetch("/api/public/staff");
        if (res.ok) {
          const data = await res.json();
          setMembers(data);
        }
      } catch {
        console.error("Failed to fetch staff");
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  const groupedMembers = useMemo(() => {
    const groups: { [key: string]: StaffMember[] } = {};
    const assigned = new Set<string>();

    for (const group of STAFF_ROLE_GROUPS) {
      groups[group.label] = [];
      for (const member of members) {
        if (assigned.has(member.userId)) continue;
        if (member.roles.some((r) => group.roleIds.includes(r))) {
          groups[group.label].push(member);
          assigned.add(member.userId);
        }
      }
    }

    groups["Other"] = members.filter((m) => !assigned.has(m.userId));

    return groups;
  }, [members]);

  const staffGroups = STAFF_ROLE_GROUPS;

  return (
    <section id="staff" className="relative py-32 px-6">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[500px] bg-crimson/[0.03] rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[400px] bg-gold/[0.02] rounded-full blur-[120px]" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-gold" />
            <span className="text-gold text-xs tracking-[0.3em] uppercase font-medium">Our Team</span>
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-gold" />
          </div>
          <h2 className="font-display text-5xl md:text-6xl lg:text-7xl">
            RUNNING THE <span className="fire-text">SHOW</span>
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} className="p-6">
                <div className="flex flex-col items-center gap-3">
                  <SkeletonCircle className="w-16 h-16" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </SkeletonCard>
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-text-muted text-sm">No staff members found.</p>
          </div>
        ) : (
          <>
            {/* Staff groups */}
            {staffGroups.map((group) => {
              const groupMembers = groupedMembers[group.label];
              if (!groupMembers || groupMembers.length === 0) return null;

              return (
                <div key={group.label} className="mb-16">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex-1 h-px" style={{ backgroundImage: `linear-gradient(to right, transparent, ${group.accent}30)` }} />
                    <div className="text-center">
                      <h3 className="font-display text-xl tracking-[0.15em] uppercase" style={{ color: group.accent }}>
                        {group.label}
                      </h3>
                      <p className="text-text-muted text-[11px] mt-0.5">{group.description}</p>
                    </div>
                    <div className="flex-1 h-px" style={{ backgroundImage: `linear-gradient(to left, transparent, ${group.accent}30)` }} />
                  </div>

                  <div className={`grid gap-4 ${
                    groupMembers.length <= 3 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" :
                    groupMembers.length <= 6 ? "grid-cols-2 md:grid-cols-3" :
                    "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                  }`}>
                    {groupMembers.map((m) => (
                      <StaffCard key={m.userId} member={m} accent={group.accent} onClick={() => router.push(`/profile/${m.userId}`)} />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Other staff */}
            {groupedMembers["Other"] && groupedMembers["Other"].length > 0 && (
              <div className="mb-16">
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
                  <h3 className="font-display text-xl tracking-[0.15em] uppercase text-text-muted">Other Staff</h3>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {groupedMembers["Other"].map((m) => (
                    <StaffCard key={m.userId} member={m} accent="#666" onClick={() => router.push(`/profile/${m.userId}`)} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
