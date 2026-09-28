import { describe, expect, it } from "vitest";
import { needsRulesAcceptance } from "@/features/rules/rules";
import { computeSitInWindow, minutesLeft, pointsToSessions, shouldWarn } from "@/features/sit-ins/rules";

const at = (hhmm: string) => new Date(`2026-09-28T${hhmm}:00Z`);

describe("computeSitInWindow", () => {
  const hours = { maxMinutes: 180, opensAt: at("07:00"), closesAt: at("18:00") };

  it("ends after the maximum duration when that's before closing", () => {
    expect(computeSitInWindow(at("09:00"), hours)).toEqual({ endsAt: at("12:00"), endsAtClosing: false });
  });

  it("ends at closing time when the limit would run past it", () => {
    expect(computeSitInWindow(at("16:30"), hours)).toEqual({ endsAt: at("18:00"), endsAtClosing: true });
  });

  it("refuses outside opening hours", () => {
    expect(computeSitInWindow(at("06:59"), hours)).toBeNull();
    expect(computeSitInWindow(at("18:00"), hours)).toBeNull();
  });
});

describe("pointsToSessions", () => {
  it("carries leftover points over instead of discarding them", () => {
    expect(pointsToSessions(3, 3)).toEqual({ sessions: 1, pointsUsed: 3 });
    expect(pointsToSessions(7, 3)).toEqual({ sessions: 2, pointsUsed: 6 });
    expect(pointsToSessions(2, 3)).toEqual({ sessions: 0, pointsUsed: 0 });
  });

  it("never converts a negative balance", () => {
    expect(pointsToSessions(-4, 3)).toEqual({ sessions: 0, pointsUsed: 0 });
  });
});

describe("warnings and countdown", () => {
  it("warns once, inside the warning window", () => {
    const endsAt = at("12:00");
    expect(shouldWarn({ endsAt, warnedAt: null }, at("11:49"), 10)).toBe(false);
    expect(shouldWarn({ endsAt, warnedAt: null }, at("11:50"), 10)).toBe(true);
    expect(shouldWarn({ endsAt, warnedAt: at("11:50") }, at("11:55"), 10)).toBe(false);
    expect(shouldWarn({ endsAt, warnedAt: null }, at("11:59"), 0)).toBe(false);
  });

  it("rounds minutes left up and floors at zero", () => {
    expect(minutesLeft(at("12:00"), new Date("2026-09-28T11:58:30Z"))).toBe(2);
    expect(minutesLeft(at("12:00"), at("12:05"))).toBe(0);
  });
});

describe("needsRulesAcceptance", () => {
  const settings = { rulesText: "Be kind.", rulesVersion: 2 };
  it("asks until the current version is accepted", () => {
    expect(needsRulesAcceptance(settings, { rulesAcceptedVer: null })).toBe(true);
    expect(needsRulesAcceptance(settings, { rulesAcceptedVer: 1 })).toBe(true);
    expect(needsRulesAcceptance(settings, { rulesAcceptedVer: 2 })).toBe(false);
  });
  it("doesn't ask when there are no rules", () => {
    expect(needsRulesAcceptance({ rulesText: "  ", rulesVersion: 3 }, { rulesAcceptedVer: null })).toBe(false);
  });
});
