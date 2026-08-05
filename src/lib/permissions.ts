export const ROLE_LEVELS = {
  STAFF: "staff",
  MANAGEMENT: "management",
  OWNER: "owner",
} as const;

export type RoleLevel = (typeof ROLE_LEVELS)[keyof typeof ROLE_LEVELS];

const LEVEL_ORDER: RoleLevel[] = ["staff", "management", "owner"];

export function hasPermission(userLevel: string, requiredLevel: RoleLevel): boolean {
  const userIdx = LEVEL_ORDER.indexOf(userLevel as RoleLevel);
  const reqIdx = LEVEL_ORDER.indexOf(requiredLevel);
  if (userIdx === -1 || reqIdx === -1) return false;
  return userIdx >= reqIdx;
}

export function getRoleLevel(headers: Headers): string {
  return headers.get("x-role-level") || "staff";
}

export function getUserRolesFromHeaders(headers: Headers): string[] {
  const raw = headers.get("x-user-roles");
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
