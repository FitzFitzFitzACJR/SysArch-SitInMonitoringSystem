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
  | "schedules"
  | "map"
  | "issues"
  | "announcements"
  | "feedback"
  | "resources";

export type NavItem = { href: string; label: string; icon: NavIcon; permission?: Permission };

// Entries are added here as each phase ships its pages.
const STUDENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/reservations", label: "Reservations", icon: "reservations" },
  { href: "/lab-map", label: "Lab availability", icon: "map" },
  { href: "/history", label: "Sit-in history", icon: "history" },
  { href: "/announcements", label: "Announcements", icon: "announcements" },
  { href: "/resources", label: "Lab resources", icon: "resources" },
  { href: "/feedback", label: "Feedback", icon: "feedback" },
  { href: "/profile", label: "Profile", icon: "profile" },
];

const STAFF_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/sit-ins", label: "Sit-ins", icon: "sitIns", permission: "sitIn:manage" },
  { href: "/admin/reservations", label: "Reservations", icon: "reservations", permission: "reservation:decide" },
  { href: "/admin/students", label: "Students", icon: "students", permission: "student:edit" },
  { href: "/admin/labs", label: "Labs & computers", icon: "labs", permission: "computer:manage" },
  { href: "/admin/issues", label: "Computer issues", icon: "issues", permission: "issue:resolve" },
  { href: "/admin/announcements", label: "Announcements", icon: "announcements", permission: "announcement:manage" },
  { href: "/admin/feedback", label: "Feedback", icon: "feedback", permission: "feedback:read" },
  { href: "/admin/resources", label: "Lab resources", icon: "resources", permission: "resource:manage" },
  { href: "/admin/schedules", label: "Class schedules", icon: "schedules", permission: "schedule:manage" },
  { href: "/admin/staff", label: "Staff accounts", icon: "staff", permission: "staff:manage" },
  { href: "/admin/settings", label: "Settings", icon: "settings", permission: "settings:manage" },
];

/** Only links the user can actually use are shown; the pages enforce the same rules server-side. */
export function navFor(role: Role): NavItem[] {
  const items = role === "STUDENT" ? STUDENT_NAV : STAFF_NAV;
  return items.filter((item) => !item.permission || can(role, item.permission));
}
