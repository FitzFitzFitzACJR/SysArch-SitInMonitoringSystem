import type { Role } from "@/generated/prisma/enums";

// Staff capabilities. Student self-service actions (booking, feedback, own profile) aren't
// permissions — they're checked by role + ownership in each service.
export const PERMISSIONS = [
  "sitIn:manage",
  "computer:manage",
  "issue:resolve",
  "reservation:decide",
  "feedback:read",
  "announcement:manage",
  "resource:manage",
  "schedule:manage",
  "points:award",
  "report:view",
  "student:edit",
  "student:delete",
  "student:import",
  "semester:manage",
  "settings:manage",
  "staff:manage",
  "audit:view",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const LAB_STAFF: readonly Permission[] = [
  "sitIn:manage",
  "computer:manage",
  "issue:resolve",
  "reservation:decide",
  "feedback:read",
  "announcement:manage",
  "resource:manage",
  "schedule:manage",
  "points:award",
  "report:view",
  "student:edit",
];

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  STUDENT: [],
  LAB_STAFF,
  SUPER_ADMIN: PERMISSIONS,
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function isStaff(role: Role): boolean {
  return role === "LAB_STAFF" || role === "SUPER_ADMIN";
}

/** Landing page for each role after login. */
export function homePathFor(role: Role): string {
  return isStaff(role) ? "/admin" : "/dashboard";
}
