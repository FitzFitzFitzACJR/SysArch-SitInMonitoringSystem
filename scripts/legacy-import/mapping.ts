// Pure mapping rules from the PHP system's data to the new model. No database access,
// so each rule is unit-tested (tests/unit/legacy-import.test.ts).

import { localTimeToInstant } from "../../src/lib/time";

/** register.php stored the course as a number: 1 BSIT, 2 BSA, 3 BSCS, 4 BSCRIM. */
export const LEGACY_COURSES: Record<string, { code: string; name: string }> = {
  "1": { code: "BSIT", name: "Bachelor of Science in Information Technology" },
  "2": { code: "BSA", name: "Bachelor of Science in Accountancy" },
  "3": { code: "BSCS", name: "Bachelor of Science in Computer Science" },
  "4": { code: "BSCRIM", name: "Bachelor of Science in Criminology" },
};

export function courseCode(value: unknown): string | null {
  const v = String(value ?? "").trim();
  if (LEGACY_COURSES[v]) return LEGACY_COURSES[v].code;
  const upper = v.toUpperCase();
  return Object.values(LEGACY_COURSES).some((c) => c.code === upper) ? upper : null;
}

const LANGUAGES = ["C#", "C", "Java", "ASP.Net", "PHP", "Other"];

/** Case-insensitive match against the languages the old system offered. */
export function languageName(value: unknown): string | null {
  const v = String(value ?? "")
    .trim()
    .toLowerCase();
  return LANGUAGES.find((l) => l.toLowerCase() === v) ?? null;
}

/**
 * Some reservation rows have the language in `purpose` and no `programming_language`
 * (two submit forms wrote different columns). Detect and swap them back.
 */
export function reservationLanguage(row: { purpose: unknown; programming_language: unknown }) {
  const lang = languageName(row.programming_language);
  if (lang)
    return { language: lang, purpose: String(row.purpose ?? "").trim() || "(no purpose recorded)", swapped: false };
  const fromPurpose = languageName(row.purpose);
  if (fromPurpose) return { language: fromPurpose, purpose: "(imported: purpose not recorded)", swapped: true };
  return { language: "Other", purpose: String(row.purpose ?? "").trim() || "(no purpose recorded)", swapped: false };
}

/** "YYYY-MM-DD HH:MM:SS" as written in `timeZone` → the real instant. */
export function legacyInstant(value: unknown, timeZone: string): Date | null {
  const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(String(value ?? ""));
  if (!m) return null;
  const day = new Date(`${m[1]}T00:00:00Z`);
  const at = localTimeToInstant(day, Number(m[2]) * 60 + Number(m[3]), timeZone);
  return new Date(at.getTime() + Number(m[4] ?? 0) * 1000);
}

/**
 * The PHP app wrote `session_start` via MySQL's clock (the server's zone) but
 * `session_end` via PHP's date() (XAMPP's default zone). Reading each in its own zone
 * fixes the negative durations; anything still backwards is clamped to zero length.
 */
export function sitInTimes(
  row: { session_start: unknown; session_end: unknown },
  zones: { mysql: string; php: string },
): { start: Date; end: Date | null; clamped: boolean } | null {
  const start = legacyInstant(row.session_start, zones.mysql);
  if (!start) return null;
  const end = legacyInstant(row.session_end, zones.php);
  if (end && end < start) return { start, end: start, clamped: true };
  return { start, end, clamped: false };
}

/** "16:00-17:30" or "7:00:00 - 9:00:00" → minutes after midnight. */
export function parseTimeRange(value: unknown): { startMinute: number; endMinute: number } | null {
  const m = /^\s*(\d{1,2}):(\d{2})(?::\d{2})?\s*-\s*(\d{1,2}):(\d{2})(?::\d{2})?\s*$/.exec(String(value ?? ""));
  if (!m) return null;
  const startMinute = Number(m[1]) * 60 + Number(m[2]);
  const endMinute = Number(m[3]) * 60 + Number(m[4]);
  return startMinute < endMinute && endMinute <= 1440 ? { startMinute, endMinute } : null;
}

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
export function dayOfWeek(value: unknown): number | null {
  const i = DAYS.indexOf(
    String(value ?? "")
      .trim()
      .toLowerCase(),
  );
  return i >= 0 ? i : null;
}

export function feedbackCategory(value: unknown) {
  const v = String(value ?? "")
    .trim()
    .toUpperCase();
  return (["EQUIPMENT", "FACILITIES", "STAFF", "SERVICES"] as const).find((c) => c === v) ?? "OTHER";
}

/** Old rooms were codes ("524", "MAC"); some rows say "Lab 1" or nothing at all. */
export function labCode(value: unknown): string | null {
  const v = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/^LAB\s*/, "");
  return v || null;
}

export const isBcrypt = (hash: unknown) => /^\$2[aby]\$\d\d\$/.test(String(hash ?? ""));

export function clampYearLevel(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 4 ? n : null;
}
