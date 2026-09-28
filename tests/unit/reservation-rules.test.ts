import { describe, expect, it } from "vitest";
import {
  classDuring,
  dateProblem,
  isNoShow,
  overlaps,
  reminderDue,
  slotAt,
  slotStatus,
  type Slot,
} from "@/features/reservations/rules";

const d = (ymd: string) => new Date(`${ymd}T00:00:00Z`);
const slot = (start: number, end: number): Slot => ({ id: `${start}`, startMinute: start, endMinute: end });
const nine = slot(9 * 60 + 30, 11 * 60); // 9:30–11:00

describe("dates", () => {
  it("allows today through the booking window only", () => {
    expect(dateProblem(d("2026-09-28"), d("2026-09-28"), 14)).toBeNull();
    expect(dateProblem(d("2026-10-12"), d("2026-09-28"), 14)).toBeNull();
    expect(dateProblem(d("2026-10-13"), d("2026-09-28"), 14)).toMatch(/14 days ahead/);
    expect(dateProblem(d("2026-09-27"), d("2026-09-28"), 14)).toMatch(/passed/);
  });
});

describe("classes and slots", () => {
  const classes = [{ dayOfWeek: 1, startMinute: 10 * 60, endMinute: 12 * 60, courseCode: "IT101" }];

  it("treats touching ranges as not overlapping", () => {
    expect(overlaps(480, 570, 570, 660)).toBe(false);
    expect(overlaps(480, 571, 570, 660)).toBe(true);
  });

  it("finds a class that overlaps a slot on the same weekday", () => {
    expect(classDuring(nine, 1, classes)?.courseCode).toBe("IT101");
    expect(classDuring(nine, 2, classes)).toBeUndefined();
  });

  it("finds the slot happening now", () => {
    expect(slotAt([nine], 10 * 60)).toBe(nine);
    expect(slotAt([nine], 11 * 60)).toBeUndefined();
  });
});

describe("slotStatus", () => {
  const base = {
    slot: nine,
    isToday: false,
    nowMinute: 0,
    dayOfWeek: 2,
    hours: { opensAt: 7 * 60, closesAt: 18 * 60 },
    classes: [{ dayOfWeek: 1, startMinute: 600, endMinute: 720, courseCode: "IT101" }],
    capacity: 50,
    booked: 0,
  };

  it("reports free places", () => expect(slotStatus({ ...base, booked: 12 })).toEqual({ kind: "open", free: 38 }));
  it("is full when every place is held", () => expect(slotStatus({ ...base, booked: 50 })).toEqual({ kind: "full" }));
  it("blocks slots during a class", () =>
    expect(slotStatus({ ...base, dayOfWeek: 1 })).toEqual({ kind: "class", courseCode: "IT101" }));
  it("blocks slots outside lab hours", () =>
    expect(slotStatus({ ...base, hours: { opensAt: 13 * 60, closesAt: 18 * 60 } })).toEqual({ kind: "closed" }));
  it("blocks slots that already started today", () =>
    expect(slotStatus({ ...base, isToday: true, nowMinute: 9 * 60 + 30 })).toEqual({ kind: "past" }));
});

describe("no-shows and reminders", () => {
  const start = new Date("2026-09-28T01:30:00Z");
  it("marks a no-show only after the grace period", () => {
    expect(isNoShow(start, new Date("2026-09-28T01:45:00Z"), 15)).toBe(false);
    expect(isNoShow(start, new Date("2026-09-28T01:45:01Z"), 15)).toBe(true);
  });
  it("sends reminders inside the window, before the start", () => {
    expect(reminderDue(start, new Date("2026-09-28T00:29:00Z"), 60)).toBe(false);
    expect(reminderDue(start, new Date("2026-09-28T00:31:00Z"), 60)).toBe(true);
    expect(reminderDue(start, new Date("2026-09-28T01:31:00Z"), 60)).toBe(false);
  });
});
