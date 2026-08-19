"use client";

import { useEffect, useState } from "react";
import { GrantSection } from "@/components/config/ConfigShared";

interface GrantRow {
  scope: string;
  granteeType: string;
  granteeId: string;
  granteeName: string;
  grantedBy: string;
  grantedByUser: string;
  grantedAt: string;
}

const SCOPE_META: Record<string, { label: string; hint: string; border: string }> = {
  site: {
    label: "Site Branding",
    hint: "Can edit the full site identity — name, tagline, logo, colours and SEO. Owners always keep this too.",
    border: "color-mix(in srgb, var(--color-crimson) 30%, transparent)",
  },
  links: {
    label: "Community Links",
    hint: "Can change the Discord invite link and server IP. Brand identity (name, logo, colours, SEO) stays owner-only.",
    border: "color-mix(in srgb, var(--color-gold) 25%, transparent)",
  },
  content: {
    label: "Content (FAQ & Shop)",
    hint: "Can edit the public FAQ and shop content. Management no longer has blanket access — only who you grant here.",
    border: "color-mix(in srgb, var(--color-gold) 25%, transparent)",
  },
};

export default function SiteConfigAccessPanel() {
  const [grants, setGrants] = useState<GrantRow[]>([]);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    fetch("/api/staff/site/grants")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setGrants(d.grants || []);
        setRoles(d.roles || []);
      })
      .catch(() => setError("Failed to load access grants."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grant = async (scope: string, body: { granteeType: string; granteeId: string; granteeName?: string }) => {
    const r = await fetch("/api/staff/site/grants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope, ...body }),
    });
    if (r.ok) {
      setError("");
      load();
    } else {
      const j = await r.json().catch(() => ({}));
      setError(j.error || "Failed to grant access.");
    }
  };

  const revoke = async (scope: string, type: string, id: string) => {
    const r = await fetch(
      `/api/staff/site/grants?scope=${encodeURIComponent(scope)}&type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
    if (r.ok) {
      setError("");
      load();
    } else {
      setError("Failed to revoke access.");
    }
  };

  return (
    <div className="rounded-2xl p-6 mb-6 stagger-4" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="flex items-center gap-2 mb-1">
        <h2 className="font-display text-sm tracking-[0.15em] uppercase text-white">Who can edit</h2>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-gold/40 bg-gold/10 text-gold shrink-0">Owner only</span>
      </div>
      <p className="text-text-muted text-[11px] mb-5">
        Choose who can change the delegated parts of the site config. Owners can always edit everything.
      </p>

      {error && (
        <div className="mb-4 px-3 py-2.5 rounded-lg text-xs text-[#f87171] border border-[#f87171]/25 bg-[#f87171]/10">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-text-muted text-xs py-4">Loading access grants…</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {Object.entries(SCOPE_META).map(([scope, meta]) => {
            const rows = grants.filter((g) => g.scope === scope);
            return (
              <div key={scope} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${meta.border}` }}>
                <h3 className="font-display text-xs tracking-[0.15em] uppercase text-gold mb-1">{meta.label}</h3>
                <p className="text-[10px] text-text-muted mb-4">{meta.hint}</p>
                <GrantSection
                  kind="editor"
                  dept={scope}
                  rows={rows}
                  roles={roles}
                  emptyText={`No one granted. Only you can edit ${meta.label} right now.`}
                  onGrant={(body) => grant(scope, body)}
                  onRevoke={(d, type, id) => revoke(d, type, id)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
