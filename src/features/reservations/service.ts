import "server-only";
import { db, serializable, type Tx } from "@/lib/db";
import { DomainError, NotFoundError } from "@/lib/errors";
import { uniqueViolation } from "@/lib/prisma-errors";
import { dateOnlyInTz, formatMinutes12h, localTimeToInstant, minutesOfDayInTz } from "@/lib/time";
import { writeAudit } from "@/features/audit/service";
import { labHours } from "@/features/labs/rules";
import { notify, notifyStaff } from "@/features/notifications/service";
import { awardPoints } from "@/features/points/ledger";
import { getSemesterForDate } from "@/features/semesters/queries";
import { getSettings } from "@/features/settings/queries";
import { dateProblem, isNoShow, reminderDue, slotAt, slotStatus, type SlotStatus } from "./rules";
import type { ReservationInput } from "./schemas";

type Actor = { id: string; ip: string | null };
type Settings = Awaited<ReturnType<typeof getSettings>>;

const LIVE = ["PENDING", "APPROVED"] as const;

const RACE_MESSAGES = {
  live_per_computer_slot: "Someone just booked that computer for this slot. Pick another.",
  live_per_student_slot: "You already have a booking for this time slot.",
};

const dateLabel = (date: Date) =>
  new Intl.DateTimeFormat("en-PH", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(date);

export const slotLabel = (slot: { startMinute: number; endMinute: number }) =>
  `${formatMinutes12h(slot.startMinute)}–${formatMinutes12h(slot.endMinute)}`;

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------

/**
 * Everything the booking screen needs for one lab on one day: each slot's status, which
 * PCs are already taken in each slot, and the PCs a student could pick.
 */
export async function getDayAvailability(labId: string, date: Date, client: Tx | typeof db = db) {
  const settings = await getSettings();
  const now = new Date();
  const today = dateOnlyInTz(now, settings.timezone);
  const [lab, slots, computers, bookings, semester] = await Promise.all([
    client.lab.findUnique({ where: { id: labId } }),
    client.timeSlot.findMany({ where: { isActive: true }, orderBy: { startMinute: "asc" } }),
    client.computer.findMany({
      where: { labId, state: "ACTIVE" },
      orderBy: { number: "asc" },
      select: { id: true, number: true },
    }),
    client.reservation.findMany({
      where: { labId, date, status: { in: [...LIVE] } },
      select: { timeSlotId: true, computerId: true },
    }),
    getSemesterForDate(date, client),
  ]);
  if (!lab) throw new NotFoundError("Lab");
  const classes = semester
    ? await client.labSchedule.findMany({ where: { labId, semesterId: semester.id, dayOfWeek: date.getUTCDay() } })
    : [];

  const hours = labHours(lab, settings);
  const isToday = date.getTime() === today.getTime();
  const nowMinute = minutesOfDayInTz(now, settings.timezone);

  return {
    lab,
    computers,
    semester,
    slots: slots.map((slot) => {
      const inSlot = bookings.filter((b) => b.timeSlotId === slot.id);
      const status: SlotStatus = !lab.isActive
        ? { kind: "closed" }
        : slotStatus({
            slot,
            isToday,
            nowMinute,
            dayOfWeek: date.getUTCDay(),
            hours,
            classes,
            capacity: computers.length,
            booked: inSlot.length,
          });
      return {
        id: slot.id,
        label: slot.label,
        startMinute: slot.startMinute,
        endMinute: slot.endMinute,
        status,
        takenComputerIds: inSlot.map((b) => b.computerId).filter((id): id is string => Boolean(id)),
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// Booking
// ---------------------------------------------------------------------------

export async function createReservation(studentId: string, input: ReservationInput) {
  const settings = await getSettings();
  const today = dateOnlyInTz(new Date(), settings.timezone);

  const problem = dateProblem(input.date, today, settings.reservationMaxDaysAhead);
  if (problem) throw new DomainError(problem, { date: [problem] });

  try {
    return await serializable(async (tx) => {
      const student = await tx.user.findUniqueOrThrow({ where: { id: studentId } });
      if (student.status !== "ACTIVE") throw new DomainError("Your account isn't active.");

      // You can't hold more upcoming bookings than you have sessions to spend on them.
      const upcoming = await tx.reservation.count({
        where: { studentId, date: { gte: today }, status: { in: [...LIVE] } },
      });
      if (student.remainingSessions <= upcoming) {
        throw new DomainError(
          student.remainingSessions === 0
            ? "You have no remaining sessions."
            : `You have ${student.remainingSessions} session(s) left and ${upcoming} upcoming booking(s) already.`,
        );
      }

      const semester = await getSemesterForDate(input.date, tx);
      if (!semester) throw new DomainError("Bookings are only open during a semester.");

      if (settings.noShowBlockThreshold) {
        const noShows = await tx.reservation.count({
          where: { studentId, semesterId: semester.id, status: "NO_SHOW" },
        });
        if (noShows >= settings.noShowBlockThreshold) {
          throw new DomainError(`Booking is blocked for this semester after ${noShows} no-shows. Ask the lab staff.`);
        }
      }

      const language = await tx.language.findFirst({ where: { id: input.languageId, isActive: true } });
      if (!language) throw new DomainError("Select a valid language.");

      // Same checks the booking screen shows, re-done here against fresh data.
      const day = await getDayAvailability(input.labId, input.date, tx);
      const slot = day.slots.find((s) => s.id === input.timeSlotId);
      if (!slot) throw new DomainError("That time slot isn't available.");
      const reasons: Record<SlotStatus["kind"], string> = {
        past: "That time slot has already started.",
        closed: `${day.lab.name} is closed then.`,
        class: slot.status.kind === "class" ? `There's a class (${slot.status.courseCode}) in the lab then.` : "",
        full: "That slot is fully booked.",
        open: "",
      };
      if (slot.status.kind !== "open") throw new DomainError(reasons[slot.status.kind]);

      if (input.computerId) {
        if (!day.computers.some((c) => c.id === input.computerId))
          throw new DomainError("That computer isn't available.");
        if (slot.takenComputerIds.includes(input.computerId))
          throw new DomainError(RACE_MESSAGES.live_per_computer_slot);
      }

      const autoApprove = !settings.requireReservationApproval;
      const reservation = await tx.reservation.create({
        data: {
          studentId,
          labId: input.labId,
          computerId: input.computerId,
          timeSlotId: input.timeSlotId,
          date: input.date,
          languageId: input.languageId,
          purpose: input.purpose,
          semesterId: semester.id,
          status: autoApprove ? "APPROVED" : "PENDING",
          decidedAt: autoApprove ? new Date() : null,
        },
      });

      const when = `${dateLabel(input.date)}, ${slot.label}`;
      if (autoApprove) {
        await notify(tx, studentId, {
          type: "RESERVATION",
          title: "Reservation confirmed",
          body: `${day.lab.name}, ${when}. Show your QR code at the lab.`,
          link: "/reservations",
        });
      } else {
        await notifyStaff(tx, {
          type: "RESERVATION",
          title: "New reservation request",
          body: `${student.firstName} ${student.lastName} · ${day.lab.name}, ${when}`,
          link: "/admin/reservations",
        });
      }
      return reservation;
    });
  } catch (e) {
    throw uniqueViolation(e, RACE_MESSAGES) ?? e;
  }
}

async function loadReservation(tx: Tx, id: string) {
  const r = await tx.reservation.findUnique({
    where: { id },
    include: {
      lab: true,
      timeSlot: true,
      computer: true,
      student: { select: { id: true, idNumber: true, firstName: true, lastName: true } },
    },
  });
  if (!r) throw new NotFoundError("Reservation");
  return r;
}

export async function decideReservation(id: string, approve: boolean, note: string | undefined, actor: Actor) {
  const settings = await getSettings();
  return db.$transaction(async (tx) => {
    const r = await loadReservation(tx, id);
    if (r.status !== "PENDING") throw new DomainError("This request has already been handled.");
    const start = localTimeToInstant(r.date, r.timeSlot.startMinute, settings.timezone);
    if (approve && start < new Date()) throw new DomainError("This slot has already started. Reject it instead.");
    if (approve && r.computer && r.computer.state !== "ACTIVE") {
      throw new DomainError(`PC ${r.computer.number} is no longer available. Reject it so the student can rebook.`);
    }

    // Pending requests already hold their place, so approving can't overbook the lab.
    await tx.reservation.update({
      where: { id },
      data: {
        status: approve ? "APPROVED" : "REJECTED",
        decidedById: actor.id,
        decidedAt: new Date(),
        decisionNote: note || null,
      },
    });
    const when = `${r.lab.name}, ${dateLabel(r.date)}, ${slotLabel(r.timeSlot)}`;
    await notify(tx, r.studentId, {
      type: "RESERVATION",
      title: approve ? "Reservation approved" : "Reservation declined",
      body: approve ? `${when}. Show your QR code at the lab.` : `${when}. ${note ?? ""}`.trim(),
      link: "/reservations",
    });
    await writeAudit(tx, {
      actorId: actor.id,
      action: approve ? "reservation.approve" : "reservation.reject",
      entityType: "Reservation",
      entityId: id,
      details: { student: r.student.idNumber, when, note: note ?? null },
      ipAddress: actor.ip,
    });
  });
}

/** Students cancel their own bookings before the slot starts; staff can cancel any live booking. */
export async function cancelReservation(id: string, actor: Actor & { isStaff: boolean }) {
  const settings = await getSettings();
  return db.$transaction(async (tx) => {
    const r = await loadReservation(tx, id);
    if (!actor.isStaff && r.studentId !== actor.id) throw new NotFoundError("Reservation");
    if (!(LIVE as readonly string[]).includes(r.status)) throw new DomainError("This booking is no longer active.");
    const start = localTimeToInstant(r.date, r.timeSlot.startMinute, settings.timezone);
    if (!actor.isStaff && start <= new Date()) throw new DomainError("This slot has already started.");

    await tx.reservation.update({
      where: { id },
      data: {
        status: "CANCELLED",
        decidedById: actor.id,
        decidedAt: new Date(),
        decisionNote: actor.isStaff ? "Cancelled by lab staff" : "Cancelled by student",
      },
    });
    const when = `${r.lab.name}, ${dateLabel(r.date)}, ${slotLabel(r.timeSlot)}`;
    if (actor.isStaff) {
      await notify(tx, r.studentId, {
        type: "RESERVATION",
        title: "Reservation cancelled",
        body: `Your booking for ${when} was cancelled by the lab staff.`,
        link: "/reservations",
      });
      await writeAudit(tx, {
        actorId: actor.id,
        action: "reservation.cancel",
        entityType: "Reservation",
        entityId: id,
        details: { student: r.student.idNumber, when },
        ipAddress: actor.ip,
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Check-in integration
// ---------------------------------------------------------------------------

/**
 * The student's approved booking to use for a check-in right now: today, in a slot that
 * hasn't ended. Checking in early is fine (the booking just starts sooner).
 */
export async function findCheckInReservation(studentId: string, client: Tx | typeof db = db) {
  const settings = await getSettings();
  const now = new Date();
  const nowMinute = minutesOfDayInTz(now, settings.timezone);
  const bookings = await client.reservation.findMany({
    where: { studentId, status: "APPROVED", date: dateOnlyInTz(now, settings.timezone) },
    include: {
      timeSlot: true,
      lab: { select: { id: true, name: true } },
      computer: { select: { id: true, number: true } },
    },
  });
  return (
    bookings
      .filter((b) => b.timeSlot.endMinute > nowMinute)
      .sort((a, b) => a.timeSlot.startMinute - b.timeSlot.startMinute)[0] ?? null
  );
}

/**
 * PCs held by other students' approved bookings for the slot happening now. Walk-ins
 * can't take them (the student who booked may arrive any minute, until the no-show grace).
 */
export async function computersReservedNow(labId: string, exceptStudentId?: string, client: Tx | typeof db = db) {
  const settings = await getSettings();
  const now = new Date();
  const slots = await client.timeSlot.findMany({ where: { isActive: true } });
  const current = slotAt(slots, minutesOfDayInTz(now, settings.timezone));
  if (!current) return new Set<string>();
  const held = await client.reservation.findMany({
    where: {
      labId,
      timeSlotId: current.id,
      date: dateOnlyInTz(now, settings.timezone),
      status: "APPROVED",
      computerId: { not: null },
      ...(exceptStudentId && { studentId: { not: exceptStudentId } }),
    },
    select: { computerId: true },
  });
  return new Set(held.map((h) => h.computerId!));
}

// ---------------------------------------------------------------------------
// Scheduled: reminders, no-shows, stale requests
// ---------------------------------------------------------------------------

export async function sweepReservations(now = new Date()) {
  const settings = await getSettings();
  const today = dateOnlyInTz(now, settings.timezone);
  const live = await db.reservation.findMany({
    where: { status: { in: [...LIVE] }, date: { lte: new Date(today.getTime() + 86_400_000) } },
    include: { timeSlot: true, lab: { select: { name: true } } },
  });

  const result = { reminded: 0, noShows: 0, expired: 0 };
  for (const r of live) {
    const start = localTimeToInstant(r.date, r.timeSlot.startMinute, settings.timezone);
    const when = `${r.lab.name}, ${dateLabel(r.date)}, ${slotLabel(r.timeSlot)}`;

    if (r.status === "PENDING" && start <= now) {
      // Nobody reviewed it in time; release the place.
      await db.$transaction(async (tx) => {
        const { count } = await tx.reservation.updateMany({
          where: { id: r.id, status: "PENDING" },
          data: { status: "CANCELLED", decidedAt: now, decisionNote: "Not reviewed before the slot started" },
        });
        if (!count) return;
        result.expired++;
        await notify(tx, r.studentId, {
          type: "RESERVATION",
          title: "Reservation expired",
          body: `Your request for ${when} wasn't reviewed in time.`,
          link: "/reservations",
        });
      });
    } else if (r.status === "APPROVED" && isNoShow(start, now, settings.noShowGraceMinutes)) {
      await markNoShow(r.id, r.studentId, r.semesterId, when, settings, now);
      result.noShows++;
    } else if (
      r.status === "APPROVED" &&
      !r.reminderSentAt &&
      reminderDue(start, now, settings.reminderMinutesBefore)
    ) {
      await db.$transaction(async (tx) => {
        const { count } = await tx.reservation.updateMany({
          where: { id: r.id, reminderSentAt: null },
          data: { reminderSentAt: now },
        });
        if (!count) return;
        result.reminded++;
        await notify(tx, r.studentId, {
          type: "RESERVATION",
          title: "Reminder: lab booking soon",
          body: `${when}. Show your QR code at the lab.`,
          link: "/reservations",
        });
      });
    }
  }
  return result;
}

async function markNoShow(
  id: string,
  studentId: string,
  semesterId: string,
  when: string,
  settings: Settings,
  now: Date,
) {
  await db.$transaction(async (tx) => {
    const { count } = await tx.reservation.updateMany({
      where: { id, status: "APPROVED" },
      data: {
        status: "NO_SHOW",
        decidedAt: now,
        decisionNote: `No check-in within ${settings.noShowGraceMinutes} minutes`,
      },
    });
    if (!count) return;
    if (settings.noShowPenaltyPoints > 0) {
      await awardPoints(
        tx,
        {
          userId: studentId,
          reason: "NO_SHOW_PENALTY",
          pointsDelta: -settings.noShowPenaltyPoints,
          note: when,
          semesterId,
        },
        settings.pointsPerSession,
      );
    }
    await notify(tx, studentId, {
      type: "RESERVATION",
      title: "Missed reservation",
      body:
        `You didn't check in for ${when}, so it was marked as a no-show.` +
        (settings.noShowPenaltyPoints ? ` ${settings.noShowPenaltyPoints} point(s) deducted.` : ""),
      link: "/reservations",
    });
  });
}
