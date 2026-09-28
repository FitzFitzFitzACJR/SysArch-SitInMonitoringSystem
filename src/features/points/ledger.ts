import "server-only";
import type { LedgerReason } from "@/generated/prisma/enums";
import type { Tx } from "@/lib/db";
import { pointsToSessions } from "@/features/sit-ins/rules";

export type LedgerEntry = {
  userId: string;
  reason: LedgerReason;
  sessionsDelta?: number;
  pointsDelta?: number;
  note?: string;
  actorId?: string | null;
  sitInId?: string | null;
  semesterId?: string | null;
};

/**
 * The only way to change a student's session or point balance: updates the running totals
 * on User and appends the matching PointsLog row in the same transaction, so the totals
 * always equal the sum of the ledger.
 */
export async function adjustBalance(tx: Tx, entry: LedgerEntry) {
  const sessionsDelta = entry.sessionsDelta ?? 0;
  const pointsDelta = entry.pointsDelta ?? 0;

  const user = await tx.user.update({
    where: { id: entry.userId },
    data: {
      remainingSessions: { increment: sessionsDelta },
      pointsBalance: { increment: pointsDelta },
      // Lifetime points only count what was earned, not penalties or conversions.
      ...(pointsDelta > 0 && entry.reason !== "POINTS_CONVERSION" && { lifetimePoints: { increment: pointsDelta } }),
    },
    select: { remainingSessions: true, pointsBalance: true },
  });

  await tx.pointsLog.create({
    data: {
      userId: entry.userId,
      reason: entry.reason,
      sessionsDelta,
      pointsDelta,
      note: entry.note,
      actorId: entry.actorId ?? null,
      sitInId: entry.sitInId ?? null,
      semesterId: entry.semesterId ?? null,
    },
  });
  return user;
}

/**
 * Adds points (or a penalty, if negative) and immediately converts every full block of
 * `pointsPerSession` into a bonus session, each step recorded in the ledger.
 * Returns how many sessions were granted.
 */
export async function awardPoints(tx: Tx, entry: LedgerEntry & { pointsDelta: number }, pointsPerSession: number) {
  const { pointsBalance } = await adjustBalance(tx, entry);
  const { sessions, pointsUsed } = pointsToSessions(pointsBalance, pointsPerSession);
  if (sessions > 0) {
    await adjustBalance(tx, {
      userId: entry.userId,
      reason: "POINTS_CONVERSION",
      pointsDelta: -pointsUsed,
      sessionsDelta: sessions,
      note: `${pointsUsed} points → ${sessions} session${sessions === 1 ? "" : "s"}`,
      semesterId: entry.semesterId,
    });
  }
  return sessions;
}
