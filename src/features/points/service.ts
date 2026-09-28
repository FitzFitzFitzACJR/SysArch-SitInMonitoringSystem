import "server-only";
import { db } from "@/lib/db";
import { DomainError, NotFoundError } from "@/lib/errors";
import { writeAudit } from "@/features/audit/service";
import { notify } from "@/features/notifications/service";
import { getSessionAllotment } from "@/features/semesters/queries";
import { getSettings } from "@/features/settings/queries";
import { adjustBalance, awardPoints } from "./ledger";
import type { AwardInput } from "./schemas";

type Actor = { id: string; ip: string | null };

/**
 * Staff award (or deduct) points or sessions. Points convert to bonus sessions
 * automatically at Settings.pointsPerSession; sessions can't be taken below zero.
 */
export async function award(input: AwardInput, actor: Actor) {
  const settings = await getSettings();
  const { semesterId } = await getSessionAllotment();

  return db.$transaction(async (tx) => {
    const student = await tx.user.findFirst({ where: { id: input.studentId, role: "STUDENT" } });
    if (!student) throw new NotFoundError("Student");
    if (student.status === "ARCHIVED") throw new DomainError("Archived students can't receive points.");

    let bonusSessions = 0;
    if (input.kind === "points") {
      bonusSessions = await awardPoints(
        tx,
        {
          userId: student.id,
          reason: "MANUAL_POINTS",
          pointsDelta: input.amount,
          note: input.reason,
          actorId: actor.id,
          semesterId,
        },
        settings.pointsPerSession,
      );
    } else {
      if (student.remainingSessions + input.amount < 0) {
        throw new DomainError(`They only have ${student.remainingSessions} session(s) left.`, {
          amount: [`At most -${student.remainingSessions}`],
        });
      }
      await adjustBalance(tx, {
        userId: student.id,
        reason: "MANUAL_SESSIONS",
        sessionsDelta: input.amount,
        note: input.reason,
        actorId: actor.id,
        semesterId,
      });
    }

    const unit = input.kind === "points" ? "point" : "session";
    const n = Math.abs(input.amount);
    await notify(tx, student.id, {
      type: "POINTS",
      title:
        input.amount > 0
          ? `You received ${n} ${unit}${n === 1 ? "" : "s"}`
          : `${n} ${unit}${n === 1 ? "" : "s"} deducted`,
      body: input.reason + (bonusSessions ? ` That earned you ${bonusSessions} bonus session(s)!` : ""),
      link: "/stats",
    });
    await writeAudit(tx, {
      actorId: actor.id,
      action: `points.award.${input.kind}`,
      entityType: "User",
      entityId: student.id,
      details: { idNumber: student.idNumber, amount: input.amount, reason: input.reason, bonusSessions },
      ipAddress: actor.ip,
    });
    return { bonusSessions };
  });
}
