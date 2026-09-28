// Pure reservation rules (no database), shared by the service, the UI and unit tests.

export type Slot = { id: string; startMinute: number; endMinute: number };
export type ClassBlock = { dayOfWeek: number; startMinute: number; endMinute: number; courseCode: string };

export const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) => aStart < bEnd && bStart < aEnd;

/** Days between two UTC-midnight dates (as used for @db.Date). */
export const daysBetween = (from: Date, to: Date) => Math.round((to.getTime() - from.getTime()) / 86_400_000);

/** Can a booking be made for `date` today? Not in the past, not beyond the booking window. */
export function dateProblem(date: Date, today: Date, maxDaysAhead: number): string | null {
  const days = daysBetween(today, date);
  if (days < 0) return "That date has passed.";
  if (days > maxDaysAhead) return `You can book up to ${maxDaysAhead} day${maxDaysAhead === 1 ? "" : "s"} ahead.`;
  return null;
}

/** The class (if any) occupying the lab during this slot on this weekday. */
export function classDuring(slot: Slot, dayOfWeek: number, classes: ClassBlock[]) {
  return classes.find(
    (c) => c.dayOfWeek === dayOfWeek && overlaps(slot.startMinute, slot.endMinute, c.startMinute, c.endMinute),
  );
}

export function slotWithinHours(slot: Slot, hours: { opensAt: number; closesAt: number }) {
  return slot.startMinute >= hours.opensAt && slot.endMinute <= hours.closesAt;
}

/** The slot happening at `minuteOfDay`, if any. */
export function slotAt(slots: Slot[], minuteOfDay: number) {
  return slots.find((s) => s.startMinute <= minuteOfDay && minuteOfDay < s.endMinute);
}

export type SlotStatus =
  | { kind: "past" }
  | { kind: "closed" }
  | { kind: "class"; courseCode: string }
  | { kind: "full" }
  | { kind: "open"; free: number };

/**
 * What a student sees for a slot. `booked` counts live (pending + approved) bookings, which
 * all hold a place, so an approval can never overbook the lab.
 */
export function slotStatus(input: {
  slot: Slot;
  isToday: boolean;
  nowMinute: number;
  dayOfWeek: number;
  hours: { opensAt: number; closesAt: number };
  classes: ClassBlock[];
  capacity: number;
  booked: number;
}): SlotStatus {
  const { slot } = input;
  if (input.isToday && slot.startMinute <= input.nowMinute) return { kind: "past" };
  if (!slotWithinHours(slot, input.hours)) return { kind: "closed" };
  const cls = classDuring(slot, input.dayOfWeek, input.classes);
  if (cls) return { kind: "class", courseCode: cls.courseCode };
  const free = input.capacity - input.booked;
  return free > 0 ? { kind: "open", free } : { kind: "full" };
}

/** An approved booking becomes a no-show once its start plus the grace period has passed. */
export const isNoShow = (slotStart: Date, now: Date, graceMinutes: number) =>
  now.getTime() > slotStart.getTime() + graceMinutes * 60_000;

/** Due for a reminder: inside the reminder window and not started yet. */
export const reminderDue = (slotStart: Date, now: Date, minutesBefore: number) =>
  minutesBefore > 0 && now < slotStart && slotStart.getTime() - now.getTime() <= minutesBefore * 60_000;
