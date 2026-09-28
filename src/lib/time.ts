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

/** How far `timeZone` is ahead of UTC at `instant`, in ms (e.g. +8h for Asia/Manila). */
export function tzOffsetMs(instant: Date, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(instant)
      .map((p) => [p.type, Number(p.value)]),
  );
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/**
 * The real instant of "`minutes` after midnight on `day`" in `timeZone`.
 * `day` is a UTC-midnight date as returned by dateOnlyInTz / Prisma @db.Date.
 * (Two passes so it's also right on DST transition days in zones that have them.)
 */
export function localTimeToInstant(day: Date, minutes: number, timeZone: string): Date {
  const naive = day.getTime() + minutes * 60_000;
  const first = naive - tzOffsetMs(new Date(naive), timeZone);
  return new Date(naive - tzOffsetMs(new Date(first), timeZone));
}

/** Minutes after local midnight in `timeZone` for `instant`. */
export function minutesOfDayInTz(instant: Date, timeZone: string): number {
  const local = new Date(instant.getTime() + tzOffsetMs(instant, timeZone));
  return local.getUTCHours() * 60 + local.getUTCMinutes();
}

export function formatMinutes12h(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}
