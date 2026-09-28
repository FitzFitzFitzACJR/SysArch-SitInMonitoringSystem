import { describe, expect, it } from "vitest";
import { dateOnlyInTz, formatMinutes12h, hhmmToMinutes, minutesToHHMM } from "@/lib/time";

describe("time helpers", () => {
  it("round-trips HH:MM and minutes", () => {
    expect(hhmmToMinutes("07:00")).toBe(420);
    expect(hhmmToMinutes("17:30")).toBe(1050);
    expect(minutesToHHMM(1050)).toBe("17:30");
    expect(minutesToHHMM(0)).toBe("00:00");
    expect(() => hhmmToMinutes("25:00")).toThrow();
  });

  it("formats 12-hour labels", () => {
    expect(formatMinutes12h(0)).toBe("12:00 AM");
    expect(formatMinutes12h(8 * 60)).toBe("8:00 AM");
    expect(formatMinutes12h(12 * 60 + 30)).toBe("12:30 PM");
    expect(formatMinutes12h(16 * 60)).toBe("4:00 PM");
  });

  it("uses the lab's timezone for the calendar date", () => {
    // 20:00 UTC on Sept 28 is already Sept 29 in Manila (UTC+8) — the original's
    // negative-duration bug came from mixing these up.
    const instant = new Date("2026-09-28T20:00:00Z");
    expect(dateOnlyInTz(instant, "Asia/Manila").toISOString()).toBe("2026-09-29T00:00:00.000Z");
    expect(dateOnlyInTz(instant, "UTC").toISOString()).toBe("2026-09-28T00:00:00.000Z");
  });
});
