import { describe, expect, it } from "vitest";
import { snapshotStatus } from "@/features/lab-map/types";

describe("snapshotStatus", () => {
  it("shows someone sitting there above everything else", () => {
    expect(snapshotStatus({ state: "MAINTENANCE", inUse: true, reserved: true })).toBe("inUse");
  });
  it("shows staff states before bookings", () => {
    expect(snapshotStatus({ state: "LOCKED", inUse: false, reserved: true })).toBe("locked");
    expect(snapshotStatus({ state: "MAINTENANCE", inUse: false, reserved: true })).toBe("maintenance");
  });
  it("shows a PC booked for the current slot as reserved", () => {
    expect(snapshotStatus({ state: "ACTIVE", inUse: false, reserved: true })).toBe("reserved");
    expect(snapshotStatus({ state: "ACTIVE", inUse: false, reserved: false })).toBe("available");
  });
});
