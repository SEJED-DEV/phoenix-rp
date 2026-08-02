import { ROLES } from "./discord";

export interface TicketType {
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: number;
  /** Who can OPEN this ticket type. Empty = anyone. */
  openRoles: string[];
  /** Who can SEE tickets of this type. Empty = staff only. */
  viewRoles: string[];
}

export const ROLE_IDS = ROLES;

export const TICKET_TYPES: TicketType[] = [
  {
    slug: "general",
    name: "General Support",
    description: "General questions, issues, or help needed.",
    icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    color: 0x5865f2,
    openRoles: [],
    viewRoles: [ROLE_IDS.STAFF],
  },
  {
    slug: "ban-appeal",
    name: "Ban Appeal",
    description: "Appeal a ban or punishment decision.",
    icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z",
    color: 0xed4245,
    openRoles: [],
    viewRoles: [ROLE_IDS.STAFF],
  },
  {
    slug: "complaint",
    name: "Complaint",
    description: "File a complaint against a player or staff member.",
    icon: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    color: 0xfee75c,
    openRoles: [],
    viewRoles: [ROLE_IDS.STAFF],
  },
  {
    slug: "bug-report",
    name: "Bug Report",
    description: "Report a server bug or glitch.",
    icon: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    color: 0x57f287,
    openRoles: [],
    viewRoles: [ROLE_IDS.STAFF],
  },
  {
    slug: "refund",
    name: "Refund",
    description: "Request a refund for in-game purchases or donations.",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    color: 0xeb459e,
    openRoles: [],
    viewRoles: [ROLE_IDS.STAFF],
  },
  {
    slug: "high-rank",
    name: "High Rank",
    description: "Apply for a leadership or command position.",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    color: 0xd4a44a,
    openRoles: [],
    viewRoles: [ROLE_IDS.STAFF],
  },
  {
    slug: "partnership",
    name: "Partnership",
    description: "Community partnership or collaboration inquiry.",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    color: 0x5865f2,
    openRoles: [],
    viewRoles: [ROLE_IDS.STAFF],
  },
  {
    slug: "donation",
    name: "Donation",
    description: "Donation, VIP, or premium purchase inquiry.",
    icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    color: 0xeb459e,
    openRoles: [],
    viewRoles: [ROLE_IDS.STAFF],
  },
];

export function getTicketType(slug: string): TicketType | undefined {
  return TICKET_TYPES.find((t) => t.slug === slug);
}

/** Returns ticket types the user can OPEN. */
export function getAvailableTicketTypes(userRoles: string[]): TicketType[] {
  return TICKET_TYPES.filter((t) => {
    if (t.openRoles.length === 0) return true;
    return t.openRoles.some((r) => userRoles.includes(r));
  });
}

/** Returns true if the user can VIEW tickets of this type. Staff always can. */
export function canViewTicketType(ticketType: TicketType, userRoles: string[]): boolean {
  if (userRoles.includes(ROLE_IDS.STAFF)) return true;
  if (ticketType.viewRoles.length === 0) return false;
  return ticketType.viewRoles.some((r) => userRoles.includes(r));
}
