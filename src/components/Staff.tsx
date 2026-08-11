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
    <button onClick={onClick} className="staff-card" aria-label={`View ${member.username}'s profile`}>
      <div className="staff-card-glow" style={{ background: `radial-gradient(circle at 50% 0%, ${accent}14 0%, transparent 70%)` }} />
      <div className="relative">
        <div className="staff-avatar">
          <img src={member.avatar} alt={member.username} loading="lazy" />
        </div>
        <h3 className="staff-card-name">{member.username}</h3>
        {primaryRole && (
          <p className="staff-card-role" style={{ color: primaryRole.color }}>
            {primaryRole.name}
          </p>
        )}
        {otherRoles.length > 0 && (
          <div className="staff-card-chips">
            {otherRoles.map((r) => (
              <span
                key={r.id}
                className="staff-chip"
                style={{ borderColor: `${r.color}1e`, backgroundColor: `${r.color}0a`, color: `${r.color}cc` }}
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

  const activeGroups = useMemo(
    () => STAFF_ROLE_GROUPS.filter((g) => (groupedMembers[g.label]?.length ?? 0) > 0),
    [groupedMembers],
  );

  const leadershipCount = groupedMembers["Leadership"]?.length ?? 0;

  return (
    <section id="staff" className="relative min-h-screen bg-bg">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-bg" />
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full blur-[200px]" style={{ background: "color-mix(in srgb, var(--color-crimson) 4%, transparent)" }} />
      </div>

      <div className="staff-shell">
        <div className="staff-header">
          <div className="staff-eyebrow">Our Team</div>
          <h1 className="staff-title">Meet the Staff</h1>
          <p className="staff-sub">
            The people keeping the city running — leadership, management, and the staff team behind the scenes.
          </p>
        </div>

        {!loading && members.length > 0 && (
          <div className="staff-stats">
            <div className="staff-stat">
              <b>{members.length}</b>
              Total Staff
            </div>
            <div className="staff-stat">
              <b>{activeGroups.length}</b>
              Teams
            </div>
            {leadershipCount > 0 && (
              <div className="staff-stat">
                <b>{leadershipCount}</b>
                Leadership
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="staff-grid">
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
            {activeGroups.map((group) => {
              const groupMembers = groupedMembers[group.label] || [];
              return (
                <div key={group.label} className="staff-group stagger-1">
                  <div className="staff-group-head">
                    <span className="staff-group-dot" style={{ background: group.accent, boxShadow: `0 0 12px ${group.accent}60` }} />
                    <h3 className="staff-group-name">{group.label}</h3>
                    <span className="staff-group-desc">{group.description}</span>
                    <span
                      className="staff-group-count"
                      style={{ color: group.accent, borderColor: `${group.accent}30`, backgroundColor: `${group.accent}0d` }}
                    >
                      {groupMembers.length}
                    </span>
                    <span className="staff-group-rule" />
                  </div>

                  <div className="staff-grid">
                    {groupMembers.map((m) => (
                      <StaffCard
                        key={m.userId}
                        member={m}
                        accent={group.accent}
                        onClick={() => router.push(`/profile/${m.userId}`)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {groupedMembers["Other"] && groupedMembers["Other"].length > 0 && (
              <div className="staff-group stagger-1">
                <div className="staff-group-head">
                  <span className="staff-group-dot" style={{ background: "#666", boxShadow: "0 0 12px rgba(255,255,255,0.1)" }} />
                  <h3 className="staff-group-name" style={{ color: "#888" }}>Other Staff</h3>
                  <span className="staff-group-count" style={{ color: "#888", borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.02)" }}>
                    {groupedMembers["Other"].length}
                  </span>
                  <span className="staff-group-rule" />
                </div>
                <div className="staff-grid">
                  {groupedMembers["Other"].map((m) => (
                    <StaffCard
                      key={m.userId}
                      member={m}
                      accent="#666"
                      onClick={() => router.push(`/profile/${m.userId}`)}
                    />
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
