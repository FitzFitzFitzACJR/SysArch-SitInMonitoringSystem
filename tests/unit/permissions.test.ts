import { describe, expect, it } from "vitest";
import { PERMISSIONS, can, homePathFor, isStaff } from "@/lib/permissions";

describe("permissions", () => {
  it("gives students no staff permissions", () => {
    for (const p of PERMISSIONS) expect(can("STUDENT", p)).toBe(false);
  });

  it("gives super admins every permission", () => {
    for (const p of PERMISSIONS) expect(can("SUPER_ADMIN", p)).toBe(true);
  });

  it("lets lab staff run the lab but not administer the system", () => {
    expect(can("LAB_STAFF", "sitIn:manage")).toBe(true);
    expect(can("LAB_STAFF", "computer:manage")).toBe(true);
    expect(can("LAB_STAFF", "reservation:decide")).toBe(true);
    expect(can("LAB_STAFF", "student:edit")).toBe(true);

    expect(can("LAB_STAFF", "settings:manage")).toBe(false);
    expect(can("LAB_STAFF", "staff:manage")).toBe(false);
    expect(can("LAB_STAFF", "student:delete")).toBe(false);
    expect(can("LAB_STAFF", "semester:manage")).toBe(false);
    expect(can("LAB_STAFF", "audit:view")).toBe(false);
  });

  it("routes each role to its home", () => {
    expect(isStaff("STUDENT")).toBe(false);
    expect(homePathFor("STUDENT")).toBe("/dashboard");
    expect(homePathFor("LAB_STAFF")).toBe("/admin");
    expect(homePathFor("SUPER_ADMIN")).toBe("/admin");
  });
});
