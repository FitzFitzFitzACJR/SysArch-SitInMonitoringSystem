import "server-only";
import { db } from "@/lib/db";
import { dateOnlyInTz } from "@/lib/time";
import { getSemesterForDate } from "@/features/semesters/queries";
import { getSettings } from "@/features/settings/queries";
import { classDuring } from "./rules";

const bookingSelect = {
  id: true,
  date: true,
  status: true,
  purpose: true,
  decisionNote: true,
  createdAt: true,
  lab: { select: { id: true, name: true } },
  timeSlot: { select: { id: true, label: true, startMinute: true, endMinute: true } },
  computer: { select: { number: true } },
  language: { select: { name: true } },
} as const;

export async function listMyReservations(studentId: string) {
  const settings = await getSettings();
  const today = dateOnlyInTz(new Date(), settings.timezone);
  const [upcoming, past] = await Promise.all([
    db.reservation.findMany({
      where: { studentId, date: { gte: today }, status: { in: ["PENDING", "APPROVED"] } },
      orderBy: [{ date: "asc" }, { timeSlot: { startMinute: "asc" } }],
      select: bookingSelect,
    }),
    db.reservation.findMany({
      where: { studentId, NOT: { date: { gte: today }, status: { in: ["PENDING", "APPROVED"] } } },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 20,
      select: bookingSelect,
    }),
  ]);
  return { upcoming, past };
}

export function listPendingReservations() {
  return db.reservation.findMany({
    where: { status: "PENDING" },
    orderBy: [{ date: "asc" }, { timeSlot: { startMinute: "asc" } }, { createdAt: "asc" }],
    select: {
      ...bookingSelect,
      student: {
        select: { id: true, idNumber: true, firstName: true, lastName: true, photoUrl: true, remainingSessions: true },
      },
    },
  });
}

export type PendingReservation = Awaited<ReturnType<typeof listPendingReservations>>[number];

/**
 * Staff calendar: for one lab and a run of days, how many places are held in each slot,
 * and which slots are taken by classes.
 */
export async function getWeekOverview(labId: string, days: Date[]) {
  const [lab, slots, capacity, bookings] = await Promise.all([
    db.lab.findUniqueOrThrow({ where: { id: labId } }),
    db.timeSlot.findMany({ where: { isActive: true }, orderBy: { startMinute: "asc" } }),
    db.computer.count({ where: { labId, state: "ACTIVE" } }),
    db.reservation.groupBy({
      by: ["date", "timeSlotId", "status"],
      where: {
        labId,
        date: { gte: days[0], lte: days[days.length - 1] },
        status: { in: ["PENDING", "APPROVED", "FULFILLED"] },
      },
      _count: true,
    }),
  ]);
  const semesters = await Promise.all(days.map((d) => getSemesterForDate(d)));
  const semesterIds = [...new Set(semesters.filter(Boolean).map((s) => s!.id))];
  const classes = semesterIds.length
    ? await db.labSchedule.findMany({ where: { labId, semesterId: { in: semesterIds } } })
    : [];

  return {
    lab,
    capacity,
    slots,
    cells: days.map((day, i) =>
      slots.map((slot) => {
        const counts = bookings.filter((b) => b.date.getTime() === day.getTime() && b.timeSlotId === slot.id);
        const count = (status: string) => counts.find((c) => c.status === status)?._count ?? 0;
        const cls = semesters[i]
          ? classDuring(
              slot,
              day.getUTCDay(),
              classes.filter((c) => c.semesterId === semesters[i]!.id),
            )
          : undefined;
        return {
          date: day,
          slotId: slot.id,
          pending: count("PENDING"),
          approved: count("APPROVED") + count("FULFILLED"),
          classCode: cls?.courseCode ?? null,
        };
      }),
    ),
  };
}

export function listSlotBookings(labId: string, date: Date, timeSlotId: string) {
  return db.reservation.findMany({
    where: { labId, date, timeSlotId, status: { in: ["PENDING", "APPROVED", "FULFILLED", "NO_SHOW"] } },
    orderBy: { createdAt: "asc" },
    select: {
      ...bookingSelect,
      student: { select: { id: true, idNumber: true, firstName: true, lastName: true } },
    },
  });
}
