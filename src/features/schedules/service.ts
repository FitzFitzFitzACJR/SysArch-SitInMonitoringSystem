import "server-only";
import { db, type Tx } from "@/lib/db";
import { DomainError, NotFoundError } from "@/lib/errors";
import { dateOnlyInTz, formatMinutes12h } from "@/lib/time";
import { writeAudit } from "@/features/audit/service";
import { getCurrentSemester } from "@/features/semesters/queries";
import { getSettings } from "@/features/settings/queries";
import { DAYS, type ScheduleInput } from "./schemas";

type Actor = { id: string; ip: string | null };

/** Two classes can't share a lab at the same time. */
async function assertNoClash(tx: Tx, input: ScheduleInput, semesterId: string, excludeId?: string) {
  const clash = await tx.labSchedule.findFirst({
    where: {
      labId: input.labId,
      semesterId,
      dayOfWeek: input.dayOfWeek,
      startMinute: { lt: input.endMinute },
      endMinute: { gt: input.startMinute },
      ...(excludeId && { id: { not: excludeId } }),
    },
  });
  if (clash) {
    throw new DomainError(
      `Clashes with ${clash.courseCode} (${DAYS[clash.dayOfWeek]} ${formatMinutes12h(clash.startMinute)}–${formatMinutes12h(clash.endMinute)}).`,
    );
  }
}

/**
 * Upcoming live bookings the class now overlaps. Reported back to staff rather than
 * cancelled automatically: they decide whether to move the class or the students.
 */
async function bookingsDuring(tx: Tx, input: ScheduleInput) {
  const settings = await getSettings();
  const today = dateOnlyInTz(new Date(), settings.timezone);
  const bookings = await tx.reservation.findMany({
    where: { labId: input.labId, date: { gte: today }, status: { in: ["PENDING", "APPROVED"] } },
    select: { date: true, timeSlot: { select: { startMinute: true, endMinute: true } } },
  });
  return bookings.filter(
    (b) =>
      b.date.getUTCDay() === input.dayOfWeek &&
      b.timeSlot.startMinute < input.endMinute &&
      input.startMinute < b.timeSlot.endMinute,
  ).length;
}

async function currentSemesterId(tx: Tx) {
  const settings = await getSettings();
  const semester = await getCurrentSemester(settings.timezone, new Date(), tx);
  if (!semester) throw new DomainError("There's no active semester to schedule classes in.");
  return semester.id;
}

export async function createSchedule(input: ScheduleInput, actor: Actor) {
  return db.$transaction(async (tx) => {
    const semesterId = await currentSemesterId(tx);
    await assertNoClash(tx, input, semesterId);
    const schedule = await tx.labSchedule.create({ data: { ...input, semesterId } });
    await writeAudit(tx, {
      actorId: actor.id,
      action: "schedule.create",
      entityType: "LabSchedule",
      entityId: schedule.id,
      details: { ...input },
      ipAddress: actor.ip,
    });
    return { schedule, conflictingBookings: await bookingsDuring(tx, input) };
  });
}

export async function updateSchedule(id: string, input: ScheduleInput, actor: Actor) {
  return db.$transaction(async (tx) => {
    const before = await tx.labSchedule.findUnique({ where: { id } });
    if (!before) throw new NotFoundError("Class schedule");
    await assertNoClash(tx, input, before.semesterId, id);
    await tx.labSchedule.update({ where: { id }, data: input });
    await writeAudit(tx, {
      actorId: actor.id,
      action: "schedule.update",
      entityType: "LabSchedule",
      entityId: id,
      details: { before: { ...before }, after: { ...input } },
      ipAddress: actor.ip,
    });
    return { conflictingBookings: await bookingsDuring(tx, input) };
  });
}

export async function deleteSchedule(id: string, actor: Actor) {
  return db.$transaction(async (tx) => {
    const before = await tx.labSchedule.findUnique({ where: { id } });
    if (!before) throw new NotFoundError("Class schedule");
    await tx.labSchedule.delete({ where: { id } });
    await writeAudit(tx, {
      actorId: actor.id,
      action: "schedule.delete",
      entityType: "LabSchedule",
      entityId: id,
      details: { courseCode: before.courseCode, dayOfWeek: before.dayOfWeek },
      ipAddress: actor.ip,
    });
  });
}

/** Classes for the current semester, optionally for one lab. */
export async function listSchedules(labId?: string) {
  const settings = await getSettings();
  const semester = await getCurrentSemester(settings.timezone);
  if (!semester) return [];
  return db.labSchedule.findMany({
    where: { semesterId: semester.id, ...(labId && { labId }) },
    orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
    include: { lab: { select: { id: true, name: true } } },
  });
}
