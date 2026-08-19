import { getUserRolesFromHeaders } from "./permissions";
import { canEditSiteConfigScope } from "./site-config-access";

const STREAMER_EDITOR_ROLE = "1533062073087688876";

export async function canEditStreamers(userId: string, roles: string[]): Promise<boolean> {
  if (roles.includes(STREAMER_EDITOR_ROLE)) return true;
  return canEditSiteConfigScope(userId, roles, "content");
}

export function canEditStreamersFromHeaders(headers: Headers): Promise<boolean> {
  const userId = headers.get("x-user-id") || "";
  const roles = getUserRolesFromHeaders(headers);
  return canEditStreamers(userId, roles);
}
