import type { LedgerReason } from "@/generated/prisma/enums";

export const LEDGER_REASON_LABELS: Record<LedgerReason, string> = {
  SIT_IN_START: "Sit-in started",
  SIT_IN_REFUND: "Sit-in refunded",
  SIT_IN_REWARD: "Sit-in reward",
  MANUAL_POINTS: "Points awarded",
  MANUAL_SESSIONS: "Sessions adjusted",
  POINTS_CONVERSION: "Points converted",
  NO_SHOW_PENALTY: "No-show penalty",
  SEMESTER_RESET: "Semester allotment",
  LEGACY_IMPORT: "Imported from old system",
};
