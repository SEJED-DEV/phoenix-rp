export interface ProfileRole {
  id: string;
  name: string;
  color: string;
}

export const CREATOR_ID = "985444871722631199";

export const PROFILE_ROLES: ProfileRole[] = [
  { id: "985444871722631199", name: "Creator", color: "#f59e0b" },
  { id: "1471841519970287789", name: "Founder", color: "#f59e0b" },
  { id: "1504840040424018123", name: "Co-Founder", color: "#f59e0b" },
  { id: "1504840052654735390", name: "Server Supervisor", color: "#991b1b" },
  { id: "1504840056333144246", name: "Server Manager", color: "#dc2626" },
  { id: "1504840058174443582", name: "Discord Manager", color: "#7c3aed" },
  { id: "1504850103154901014", name: "Admin Supervisor", color: "#dc2626" },
  { id: "1504840067498250383", name: "Admin", color: "#ef4444" },
  { id: "1504840068798480618", name: "Admin Under Test", color: "#f87171" },
  { id: "1505998312669446144", name: "Media Manager", color: "#ec4899" },
  { id: "1504850107848331365", name: "Whitelist Supervisor", color: "#16a34a" },
  { id: "1504840075945443513", name: "Staff Team", color: "#dc2626" },
  { id: "1504840072267038721", name: "Support Team", color: "#06b6d4" },
  { id: "1504840060233842739", name: "Whitelister", color: "#22c55e" },
  { id: "1504840074377035927", name: "PC Checker", color: "#f97316" },
  { id: "1507135880824094751", name: "Developer", color: "#3b82f6" },
  { id: "1504840077879017564", name: "Donator", color: "#eab308" },
  { id: "1447891049237188679", name: "Booster", color: "#a855f7" },
  { id: "1533959429697966233", name: "🔑 | Whitelisted S2", color: "#22c55e" },
  { id: "1504840125245554769", name: "Banned", color: "#dc2626" },
  { id: "1504840125690155191", name: "Blacklisted", color: "#7f1d1d" },
  { id: "1504840124251242578", name: "Staff Warn 2", color: "#b91c1c" },
  { id: "1504840122850345042", name: "Staff Warn 3", color: "#991b1b" },
  { id: "1504840115263115375", name: "Staff Warn 1", color: "#f87171" },
  { id: "1504840112268251267", name: "Warn 1", color: "#fca5a5" },
  { id: "1504840113467953173", name: "Warn 2", color: "#ef4444" },
];

export function getProfileRole(roleId: string): ProfileRole | undefined {
  return PROFILE_ROLES.find((r) => r.id === roleId);
}

export function getProfileRoles(roleIds: string[]): ProfileRole[] {
  return PROFILE_ROLES.filter((r) => roleIds.includes(r.id));
}
