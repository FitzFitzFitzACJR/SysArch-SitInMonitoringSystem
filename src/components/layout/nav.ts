import type { Role } from "@/generated/prisma/enums";
import { can, type Permission } from "@/lib/permissions";

// Icons are referenced by name so this list stays serialisable (server → client component).
export type NavIcon =
  | "dashboard"
  | "settings"
  | "students"
  | "labs"
  | "staff"
  | "profile"
  | "sitIns"
  | "history"
  | "reservations"
  | "schedules";

export type NavItem = { href: string; label: string; icon: NavIcon; permission?: Permission };

// Entries are added here as each phase ships its pages.
const STUDENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/reservations", label: "Reservations", icon: "reservations" },
  { href: "/history", label: "Sit-in history", icon: "history" },
  { href: "/profile", label: "Profile", icon: "profile" },
];

const STAFF_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/sit-ins", label: "Sit-ins", icon: "sitIns", permission: "sitIn:manage" },
  { href: "/admin/reservations", label: "Reservations", icon: "reservations", permission: "reservation:decide" },
  { href: "/admin/students", label: "Students", icon: "students", permission: "student:edit" },
  { href: "/admin/labs", label: "Labs & computers", icon: "labs", permission: "computer:manage" },
  { href: "/admin/schedules", label: "Class schedules", icon: "schedules", permission: "schedule:manage" },
  { href: "/admin/staff", label: "Staff accounts", icon: "staff", permission: "staff:manage" },
  { href: "/admin/settings", label: "Settings", icon: "settings", permission: "settings:manage" },
];

/** Only links the user can actually use are shown; the pages enforce the same rules server-side. */
export function navFor(role: Role): NavItem[] {
  const items = role === "STUDENT" ? STUDENT_NAV : STAFF_NAV;
  return items.filter((item) => !item.permission || can(role, item.permission));
}
