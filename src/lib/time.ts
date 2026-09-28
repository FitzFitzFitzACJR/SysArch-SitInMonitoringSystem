// Times of day are stored as minutes after midnight (see prisma/schema.prisma).

export function minutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function hhmmToMinutes(value: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) throw new Error(`Invalid time "${value}", expected HH:MM`);
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * The calendar date of `instant` in `timeZone`, as a UTC-midnight Date — the same shape
 * Prisma uses for `@db.Date` columns, so the two can be compared directly.
 */
export function dateOnlyInTz(instant: Date, timeZone: string): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    instant,
  ); // en-CA formats as YYYY-MM-DD
  return new Date(`${ymd}T00:00:00Z`);
}

export function formatMinutes12h(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}
