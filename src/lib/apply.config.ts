import { ROLE_LEVELS, type RoleLevel } from "./permissions";

interface ApplyConfigEntry {
  table: string;
  requiredLevel: RoleLevel;
  label: string;
}

export const APPLY_CONFIG: Record<string, ApplyConfigEntry> = {
  whitelist:            { table: "applications_whitelist",            requiredLevel: ROLE_LEVELS.MANAGEMENT, label: "Whitelist" },
  police:               { table: "applications_police",               requiredLevel: ROLE_LEVELS.MANAGEMENT, label: "Police" },
  ems:                  { table: "applications_ems",                  requiredLevel: ROLE_LEVELS.MANAGEMENT, label: "EMS" },
  mechanic:             { table: "applications_mechanic",             requiredLevel: ROLE_LEVELS.MANAGEMENT, label: "Mechanic" },
  family:               { table: "applications_family",               requiredLevel: ROLE_LEVELS.MANAGEMENT, label: "Family" },
  doj:                  { table: "applications_doj",                  requiredLevel: ROLE_LEVELS.MANAGEMENT, label: "DOJ" },
  staff_staffteam:       { table: "applications_staff_staffteam",    requiredLevel: ROLE_LEVELS.MANAGEMENT, label: "Staff Team" },
  "ban-appeal":         { table: "applications_ban_appeal",           requiredLevel: ROLE_LEVELS.MANAGEMENT, label: "Ban Appeal" },
};

export const APPLICATION_SLUGS = Object.keys(APPLY_CONFIG);

// Applications actually submitted through the website. The rest (Police, EMS,
// Mechanic, DOJ) are handled externally via Discord and are hidden from the
// staff panel (config + applications review).
export const ON_SITE_APPLICATIONS: readonly string[] = [
  "whitelist",
  "family",
  "staff_staffteam",
  "ban-appeal",
];

export function isOnSiteSlug(slug: string): boolean {
  return ON_SITE_APPLICATIONS.includes(slug);
}

export function getApplyConfig(slug: string): ApplyConfigEntry | undefined {
  return APPLY_CONFIG[slug];
}
