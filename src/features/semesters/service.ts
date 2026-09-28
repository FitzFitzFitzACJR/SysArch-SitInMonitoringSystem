import "server-only";
import { db, type Tx } from "@/lib/db";
import { DomainError, NotFoundError } from "@/lib/errors";
import { uniqueViolation } from "@/lib/prisma-errors";
import { dateOnlyInTz } from "@/lib/time";
import { writeAudit } from "@/features/audit/service";
import { getSettings } from "@/features/settings/queries";
import type { SemesterInput } from "./schemas";

type Actor = { id: string; ip: string | null };

const UNIQUE = { name: "Another semester already has that name." };

/** Semesters can't overlap: every date belongs to at most one. */
async function assertNoOverlap(tx: Tx, input: SemesterInput, excludeId?: string) {
  const clash = await tx.semester.findFirst({
    where: {
      startsOn: { lte: input.endsOn },
      endsOn: { gte: input.startsOn },
      ...(excludeId && { id: { not: excludeId } }),
    },
  });
  if (clash) throw new DomainError(`Overlaps "${clash.name}".`, { startsOn: [`Overlaps ${clash.name}`] });
}

export async function createSemester(input: SemesterInput, actor: Actor) {
  try {
    return await db.$transaction(async (tx) => {
      await assertNoOverlap(tx, input);
      const s = await tx.semester.create({ data: input });
      await writeAudit(tx, {
        actorId: actor.id,
        action: "semester.create",
        entityType: "Semester",
        entityId: s.id,
        details: { name: s.name, startsOn: input.startsOn.toISOString().slice(0, 10), sessions: s.sessionAllotment },
        ipAddress: actor.ip,
      });
      return s;
    });
  } catch (e) {
    throw uniqueViolation(e, UNIQUE) ?? e;
  }
}

export async function updateSemester(id: string, input: SemesterInput, actor: Actor) {
  try {
    return await db.$transaction(async (tx) => {
      const before = await tx.semester.findUnique({ where: { id } });
      if (!before) throw new NotFoundError("Semester");
      // Once the reset has run, moving the start date would leave history in the wrong term.
      if (before.resetAppliedAt && input.startsOn.getTime() !== before.startsOn.getTime()) {
        throw new DomainError("This semester has already started; its start date can't change.", {
          startsOn: ["Already started"],
        });
      }
      await assertNoOverlap(tx, input, id);
      await tx.semester.update({ where: { id }, data: input });
      await writeAudit(tx, {
        actorId: actor.id,
        action: "semester.update",
        entityType: "Semester",
        entityId: id,
        details: { name: input.name, sessions: input.sessionAllotment },
        ipAddress: actor.ip,
      });
    });
  } catch (e) {
    throw uniqueViolation(e, UNIQUE) ?? e;
  }
}

/** Only a semester nothing has happened in yet can be deleted; the rest are the archive. */
export async function deleteSemester(id: string, actor: Actor) {
  return db.$transaction(async (tx) => {
    const s = await tx.semester.findUnique({
      where: { id },
      include: { _count: { select: { sitIns: true, reservations: true, schedules: true, pointsLog: true } } },
    });
    if (!s) throw new NotFoundError("Semester");
    const used = s._count.sitIns + s._count.reservations + s._count.schedules + s._count.pointsLog;
    if (used > 0 || s.resetAppliedAt) throw new DomainError("This semester has history, so it's kept as an archive.");
    await tx.semester.delete({ where: { id } });
    await writeAudit(tx, {
      actorId: actor.id,
      action: "semester.delete",
      entityType: "Semester",
      entityId: id,
      details: { name: s.name },
      ipAddress: actor.ip,
    });
  });
}

/**
 * Start-of-semester reset: every active student's remaining sessions become the allotment.
 * One statement, so it's atomic: the students are row-locked, their balance set, and a
 * matching SEMESTER_RESET ledger row written for each change (the ledger always explains
 * the balance, even if someone checks in at the same moment). Returns how many changed.
 */
export async function applySemesterReset(semesterId: string, actor: Actor | null) {
  return db.$transaction(async (tx) => {
    const s = await tx.semester.findUnique({ where: { id: semesterId } });
    if (!s) throw new NotFoundError("Semester");
    const note = `Start of ${s.name}`;
    const changed = await tx.$executeRaw`
      WITH students AS (
        SELECT id, "remainingSessions" AS old
        FROM "User"
        WHERE role = 'STUDENT' AND status = 'ACTIVE'
        FOR UPDATE
      ), updated AS (
        UPDATE "User" u SET "remainingSessions" = ${s.sessionAllotment}, "updatedAt" = now()
        FROM students s
        WHERE u.id = s.id AND s.old <> ${s.sessionAllotment}
        RETURNING s.id, s.old
      )
      INSERT INTO "PointsLog" (id, "userId", "sessionsDelta", "pointsDelta", reason, note, "actorId", "semesterId", "createdAt")
      SELECT gen_random_uuid()::text, id, ${s.sessionAllotment} - old, 0, 'SEMESTER_RESET'::"LedgerReason", ${note},
             ${actor?.id ?? null}, ${s.id}, now()
      FROM updated`;
    await tx.semester.update({ where: { id: s.id }, data: { resetAppliedAt: new Date() } });
    if (actor) {
      await writeAudit(tx, {
        actorId: actor.id,
        action: "semester.reset",
        entityType: "Semester",
        entityId: s.id,
        details: { name: s.name, sessions: s.sessionAllotment, studentsChanged: changed },
        ipAddress: actor.ip,
      });
    }
    return changed;
  });
}

/** Scheduled: apply the reset once, when the current semester begins. */
export async function sweepSemesters() {
  const settings = await getSettings();
  const today = dateOnlyInTz(new Date(), settings.timezone);
  const due = await db.semester.findFirst({
    where: { startsOn: { lte: today }, endsOn: { gte: today }, resetAppliedAt: null },
  });
  if (!due) return { reset: null };
  const changed = await applySemesterReset(due.id, null);
  return { reset: due.name, studentsChanged: changed };
}

export function listSemesters() {
  return db.semester.findMany({
    orderBy: { startsOn: "desc" },
    include: { _count: { select: { sitIns: true, reservations: true, schedules: true } } },
  });
}
