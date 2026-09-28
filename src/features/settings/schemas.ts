import { z } from "zod";
import { hhmmToMinutes } from "@/lib/time";

const int = (min: number, max: number) => z.coerce.number().int().min(min).max(max);
// The form edits times as "HH:MM"; the database stores minutes after midnight.
const minuteOfDay = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM")
  .transform(hhmmToMinutes);
// Empty input means "no limit".
const optionalInt = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v == null ? null : v), int(min, max).nullable());

// Shared by the settings form (client) and updateSettings (server).
export const SettingsSchema = z
  .object({
    timezone: z.string().refine(isValidTimeZone, "Unknown timezone"),
    defaultSessions: int(0, 1000),
    sitInRewardPoints: int(0, 100),
    pointsPerSession: int(1, 100),
    maxSitInMinutes: int(15, 24 * 60),
    warnBeforeMinutes: int(0, 120),
    labOpensAt: minuteOfDay,
    labClosesAt: minuteOfDay,
    requireReservationApproval: z.boolean(),
    reservationMaxDaysAhead: int(0, 365),
    reminderMinutesBefore: int(0, 24 * 60),
    noShowGraceMinutes: int(0, 240),
    noShowPenaltyPoints: int(0, 100),
    noShowBlockThreshold: optionalInt(1, 100),
    maxLoginAttempts: int(1, 50),
    lockoutMinutes: int(1, 24 * 60),
    sessionMaxAgeHours: int(1, 24 * 30),
    rulesText: z.string().max(20_000),
  })
  .refine((s) => s.labOpensAt < s.labClosesAt, {
    path: ["labClosesAt"],
    message: "Closing time must be after opening time",
  })
  .refine((s) => s.warnBeforeMinutes < s.maxSitInMinutes, {
    path: ["warnBeforeMinutes"],
    message: "Warning must come before the time limit",
  });

export type SettingsFormValues = z.input<typeof SettingsSchema>;
export type SettingsInput = z.output<typeof SettingsSchema>;

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
