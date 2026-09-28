import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/app-shell";
import { SettingsForm } from "@/features/settings/components/settings-form";
import { getSettings } from "@/features/settings/queries";
import { requireStaff } from "@/lib/session";
import { minutesToHHMM } from "@/lib/time";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireStaff("settings:manage");
  const s = await getSettings();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Every business rule in the system is configured here. Changes are audit-logged."
      />
      <SettingsForm
        initial={{
          timezone: s.timezone,
          defaultSessions: s.defaultSessions,
          sitInRewardPoints: s.sitInRewardPoints,
          pointsPerSession: s.pointsPerSession,
          maxSitInMinutes: s.maxSitInMinutes,
          warnBeforeMinutes: s.warnBeforeMinutes,
          labOpensAt: minutesToHHMM(s.labOpensAt),
          labClosesAt: minutesToHHMM(s.labClosesAt),
          requireReservationApproval: s.requireReservationApproval,
          reservationMaxDaysAhead: s.reservationMaxDaysAhead,
          reminderMinutesBefore: s.reminderMinutesBefore,
          noShowGraceMinutes: s.noShowGraceMinutes,
          noShowPenaltyPoints: s.noShowPenaltyPoints,
          noShowBlockThreshold: s.noShowBlockThreshold ?? "",
          maxLoginAttempts: s.maxLoginAttempts,
          lockoutMinutes: s.lockoutMinutes,
          sessionMaxAgeHours: s.sessionMaxAgeHours,
          rulesText: s.rulesText,
        }}
      />
    </>
  );
}
