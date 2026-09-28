import { describe, expect, it } from "vitest";
import { ChangePasswordSchema, RegisterSchema } from "@/features/auth/schemas";
import { SettingsSchema, type SettingsFormValues } from "@/features/settings/schemas";

const validSettings: SettingsFormValues = {
  timezone: "Asia/Manila",
  defaultSessions: "10",
  sitInRewardPoints: "1",
  pointsPerSession: "3",
  maxSitInMinutes: "180",
  warnBeforeMinutes: "10",
  labOpensAt: "07:00",
  labClosesAt: "18:00",
  requireReservationApproval: true,
  reservationMaxDaysAhead: "14",
  reminderMinutesBefore: "60",
  noShowGraceMinutes: "15",
  noShowPenaltyPoints: "0",
  noShowBlockThreshold: "",
  maxLoginAttempts: "5",
  lockoutMinutes: "15",
  sessionMaxAgeHours: "8",
  rulesText: "Be nice.",
};

describe("SettingsSchema", () => {
  it("converts form strings into stored values", () => {
    const out = SettingsSchema.parse(validSettings);
    expect(out.labOpensAt).toBe(420);
    expect(out.labClosesAt).toBe(1080);
    expect(out.defaultSessions).toBe(10);
    expect(out.noShowBlockThreshold).toBeNull();
  });

  it("rejects closing before opening", () => {
    const r = SettingsSchema.safeParse({ ...validSettings, labOpensAt: "18:00", labClosesAt: "07:00" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual(["labClosesAt"]);
  });

  it("rejects a warning longer than the time limit", () => {
    const r = SettingsSchema.safeParse({ ...validSettings, maxSitInMinutes: "30", warnBeforeMinutes: "45" });
    expect(r.success).toBe(false);
  });

  it("rejects unknown timezones", () => {
    expect(SettingsSchema.safeParse({ ...validSettings, timezone: "Mars/Olympus" }).success).toBe(false);
  });
});

describe("auth schemas", () => {
  const registration = {
    idNumber: "2024-0001",
    firstName: "Ana",
    lastName: "Reyes",
    email: "ANA@Example.com ",
    courseId: "c1",
    yearLevel: "2",
    password: "hunter22",
    confirmPassword: "hunter22",
  };

  it("normalises registration input", () => {
    const out = RegisterSchema.parse(registration);
    expect(out.email).toBe("ana@example.com");
    expect(out.yearLevel).toBe(2);
  });

  it("requires matching passwords with a letter and a number", () => {
    expect(RegisterSchema.safeParse({ ...registration, confirmPassword: "hunter23" }).success).toBe(false);
    expect(
      RegisterSchema.safeParse({ ...registration, password: "abcdefgh", confirmPassword: "abcdefgh" }).success,
    ).toBe(false);
  });

  it("rejects ID numbers with unexpected characters", () => {
    expect(RegisterSchema.safeParse({ ...registration, idNumber: "00' OR 1=1" }).success).toBe(false);
  });

  it("requires a new password different from the current one", () => {
    const r = ChangePasswordSchema.safeParse({
      currentPassword: "hunter22",
      newPassword: "hunter22",
      confirmPassword: "hunter22",
    });
    expect(r.success).toBe(false);
  });
});
