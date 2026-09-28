import { describe, expect, it } from "vitest";
import {
  courseCode,
  dayOfWeek,
  feedbackCategory,
  isBcrypt,
  labCode,
  parseTimeRange,
  reservationLanguage,
  sitInTimes,
} from "../../scripts/legacy-import/mapping";
import { parseInserts } from "../../scripts/legacy-import/parse-sql";

describe("parseInserts", () => {
  it("reads multi-row inserts with NULLs, numbers and MySQL escapes", () => {
    const sql = `
      -- comment
      INSERT INTO \`users\` (\`id\`, \`idno\`, \`lastname\`, \`midname\`) VALUES
      (1, '1', 'O\\'Brien', NULL),
      (4, '999', 'West, Jr.', 'Line\\r\\n2');
      INSERT INTO \`users\` (\`id\`, \`idno\`, \`lastname\`, \`midname\`) VALUES (7, '00', 'It''s', '');`;
    const users = parseInserts(sql).get("users")!;
    expect(users).toEqual([
      { id: 1, idno: "1", lastname: "O'Brien", midname: null },
      { id: 4, idno: "999", lastname: "West, Jr.", midname: "Line\r\n2" },
      { id: 7, idno: "00", lastname: "It's", midname: "" },
    ]);
  });
});

describe("sitInTimes", () => {
  const zones = { mysql: "Asia/Manila", php: "Europe/Berlin" };

  it("fixes the original's negative duration by reading each column in its own zone", () => {
    // Sit-in #2 in sysarch.sql: start 03:36:34 (MySQL, Manila), end 21:36:48 the day
    // before (PHP date(), Berlin), stored duration -360. Its reward was logged at 03:36:48.
    const t = sitInTimes({ session_start: "2025-05-03 03:36:34", session_end: "2025-05-02 21:36:48" }, zones)!;
    expect((t.end!.getTime() - t.start.getTime()) / 1000).toBe(14);
    expect(t.clamped).toBe(false);
  });

  it("clamps anything still backwards to zero length", () => {
    const t = sitInTimes({ session_start: "2025-05-03 12:00:00", session_end: "2025-05-03 01:00:00" }, zones)!;
    expect(t.end).toEqual(t.start);
    expect(t.clamped).toBe(true);
  });

  it("keeps an open sit-in open", () => {
    expect(sitInTimes({ session_start: "2025-05-03 05:24:40", session_end: null }, zones)!.end).toBeNull();
  });
});

describe("reservationLanguage", () => {
  it("swaps back rows where the language landed in purpose", () => {
    expect(reservationLanguage({ purpose: "PHP", programming_language: null })).toMatchObject({
      language: "PHP",
      swapped: true,
    });
  });
  it("keeps correct rows", () => {
    expect(reservationLanguage({ purpose: "walang", programming_language: "PHP" })).toEqual({
      language: "PHP",
      purpose: "walang",
      swapped: false,
    });
  });
});

describe("small mappings", () => {
  it("maps course numbers, labs, days, slots and feedback types", () => {
    expect(courseCode("2")).toBe("BSA");
    expect(courseCode("bscs")).toBe("BSCS");
    expect(courseCode("9")).toBeNull();
    expect(labCode("524")).toBe("524");
    expect(labCode("Lab 1")).toBe("1");
    expect(labCode(null)).toBeNull();
    expect(dayOfWeek("Monday")).toBe(1);
    expect(parseTimeRange("16:00-17:30")).toEqual({ startMinute: 960, endMinute: 1050 });
    expect(parseTimeRange("7:00:00 - 9:00:00")).toEqual({ startMinute: 420, endMinute: 540 });
    expect(parseTimeRange("9:00-8:00")).toBeNull();
    expect(feedbackCategory("Staff")).toBe("STAFF");
    expect(feedbackCategory("weird")).toBe("OTHER");
    expect(isBcrypt("$2y$10$abcdefghijklmnopqrstuv")).toBe(true);
    expect(isBcrypt("student123")).toBe(false);
  });
});
