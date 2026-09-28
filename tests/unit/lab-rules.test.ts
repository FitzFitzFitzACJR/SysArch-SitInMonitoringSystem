import { describe, expect, it } from "vitest";
import { computersToRemove, labHours, planStateChange, type ComputerSnapshot } from "@/features/labs/rules";

const pc = (number: number, state: ComputerSnapshot["state"], inUse = false): ComputerSnapshot => ({
  id: `pc${number}`,
  number,
  state,
  inUse,
});

describe("planStateChange", () => {
  it("refuses to lock a computer someone is using", () => {
    const plan = planStateChange([pc(1, "ACTIVE", true), pc(2, "ACTIVE")], "LOCKED");
    expect(plan.apply.map((c) => c.number)).toEqual([2]);
    expect(plan.skipped).toEqual([{ number: 1, reason: "in use" }]);
  });

  it("allows flagging an in-use computer for maintenance", () => {
    const plan = planStateChange([pc(1, "ACTIVE", true)], "MAINTENANCE");
    expect(plan.apply.map((c) => c.number)).toEqual([1]);
    expect(plan.skipped).toEqual([]);
  });

  it("skips computers already in the target state", () => {
    const plan = planStateChange([pc(1, "LOCKED"), pc(2, "MAINTENANCE")], "LOCKED");
    expect(plan.apply.map((c) => c.number)).toEqual([2]);
  });
});

describe("lab helpers", () => {
  const settings = { labOpensAt: 420, labClosesAt: 1080 };

  it("falls back to default hours per field", () => {
    expect(labHours({ opensAt: null, closesAt: null }, settings)).toEqual({ opensAt: 420, closesAt: 1080 });
    expect(labHours({ opensAt: 480, closesAt: null }, settings)).toEqual({ opensAt: 480, closesAt: 1080 });
  });

  it("removes the highest-numbered computers when shrinking", () => {
    expect(computersToRemove([1, 2, 3, 4, 5], 3)).toEqual([4, 5]);
    expect(computersToRemove([5, 1, 4, 2, 3], 5)).toEqual([]);
  });
});
