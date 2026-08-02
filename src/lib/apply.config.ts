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
  gang:                 { table: "applications_gang",                 requiredLevel: ROLE_LEVELS.MANAGEMENT, label: "Gang" },
  doj:                  { table: "applications_doj",                  requiredLevel: ROLE_LEVELS.MANAGEMENT, label: "DOJ" },
  staff_staffteam:       { table: "applications_staff_staffteam",    requiredLevel: ROLE_LEVELS.MANAGEMENT, label: "Staff Team" },
  "ban-appeal":         { table: "applications_ban_appeal",           requiredLevel: ROLE_LEVELS.MANAGEMENT, label: "Ban Appeal" },
};

export const APPLICATION_SLUGS = Object.keys(APPLY_CONFIG);

export function getApplyConfig(slug: string): ApplyConfigEntry | undefined {
  return APPLY_CONFIG[slug];
}
