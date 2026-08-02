export interface Department {
  name: string;
  roleId: string;
  type: "department" | "gang";
  color: string;
}

export const DEPARTMENTS: Department[] = [
  { name: "EMS", roleId: "1504840087962386592", type: "department", color: "#ef4444" },
  { name: "Sheriff", roleId: "1504840084602748979", type: "department", color: "#3b82f6" },
  { name: "Chang Gang", roleId: "1511562090039611432", type: "gang", color: "#a855f7" },
  { name: "M7 Block", roleId: "1511396177827074229", type: "gang", color: "#f97316" },
  { name: "Nitrox", roleId: "1511396123573485698", type: "gang", color: "#06b6d4" },
  { name: "Escobar", roleId: "1511396064983519473", type: "gang", color: "#eab308" },
  { name: "Black Hoodie", roleId: "1511395993957175426", type: "gang", color: "#6b7280" },
  { name: "Diablos", roleId: "1511395881188982824", type: "gang", color: "#dc2626" },
  { name: "XVXX Gang", roleId: "1511395632269627483", type: "gang", color: "#7c3aed" },
  { name: "Gangster", roleId: "1511396358983254126", type: "gang", color: "#9ca3af" },
];

export function getDepartmentsForMember(roleIds: string[]): Department[] {
  return DEPARTMENTS.filter((d) => roleIds.includes(d.roleId));
}
