import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { dateOnlyInTz, localTimeToInstant } from "@/lib/time";
import { getSettings } from "@/features/settings/queries";
import { MAX_EXPORT_ROWS, REPORT_PAGE_SIZE, type ReportFilter } from "./schemas";

const DAY = 86_400_000;

/** The date range a filter means, defaulting to the last 30 days (lab-local, inclusive). */
export async function resolveRange(filter: Pick<ReportFilter, "from" | "to">) {
  const { timezone } = await getSettings();
  const today = dateOnlyInTz(new Date(), timezone);
  const toDay = filter.to ? new Date(`${filter.to}T00:00:00Z`) : today;
  const fromDay = filter.from ? new Date(`${filter.from}T00:00:00Z`) : new Date(toDay.getTime() - 29 * DAY);
  const [a, b] = fromDay <= toDay ? [fromDay, toDay] : [toDay, fromDay];
  return {
    fromDay: a,
    toDay: b,
    start: localTimeToInstant(a, 0, timezone),
    end: localTimeToInstant(new Date(b.getTime() + DAY), 0, timezone), // exclusive
    timezone,
  };
}

async function whereFor(filter: ReportFilter): Promise<Prisma.SitInWhereInput> {
  const range = await resolveRange(filter);
  return {
    startedAt: { gte: range.start, lt: range.end },
    status: filter.status === "ALL" ? { not: "ACTIVE" } : filter.status,
    ...(filter.labId && { labId: filter.labId }),
    ...(filter.languageId && { languageId: filter.languageId }),
    ...((filter.courseId || filter.yearLevel) && {
      student: {
        ...(filter.courseId && { courseId: filter.courseId }),
        ...(filter.yearLevel && { yearLevel: filter.yearLevel }),
      },
    }),
  };
}

const select = {
  id: true,
  status: true,
  startedAt: true,
  endedAt: true,
  endReason: true,
  rewarded: true,
  purpose: true,
  student: {
    select: { idNumber: true, firstName: true, lastName: true, yearLevel: true, course: { select: { code: true } } },
  },
  lab: { select: { name: true } },
  computer: { select: { number: true } },
  language: { select: { name: true } },
} as const satisfies Prisma.SitInSelect;

export async function runReport(filter: ReportFilter) {
  const where = await whereFor(filter);
  const [rows, total, minutes] = await Promise.all([
    db.sitIn.findMany({
      where,
      orderBy: { startedAt: "desc" },
      skip: (filter.page - 1) * REPORT_PAGE_SIZE,
      take: REPORT_PAGE_SIZE,
      select,
    }),
    db.sitIn.count({ where }),
    totalMinutes(where),
  ]);
  return { rows, total, totalMinutes: minutes, pageCount: Math.max(1, Math.ceil(total / REPORT_PAGE_SIZE)) };
}

/** Every matching row (capped) for CSV/PDF export. */
export async function reportRowsForExport(filter: ReportFilter) {
  const where = await whereFor(filter);
  const [rows, total] = await Promise.all([
    db.sitIn.findMany({ where, orderBy: { startedAt: "asc" }, take: MAX_EXPORT_ROWS, select }),
    db.sitIn.count({ where }),
  ]);
  return { rows, total, truncated: total > rows.length };
}

export type ReportRow = Awaited<ReturnType<typeof runReport>>["rows"][number];

async function totalMinutes(where: Prisma.SitInWhereInput) {
  const rows = await db.sitIn.findMany({
    where: { ...where, endedAt: { not: null } },
    select: { startedAt: true, endedAt: true },
  });
  return rows.reduce((sum, r) => sum + Math.max(0, (r.endedAt!.getTime() - r.startedAt.getTime()) / 60_000), 0);
}

export const minutesOf = (r: { startedAt: Date; endedAt: Date | null }) =>
  r.endedAt ? Math.max(0, Math.round((r.endedAt.getTime() - r.startedAt.getTime()) / 60_000)) : null;

export function reportFilterOptions() {
  return Promise.all([
    db.lab.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.course.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true } }),
    db.language.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]).then(([labs, courses, languages]) => ({ labs, courses, languages }));
}

/** The last `days` lab-local days, ending today (inclusive). */
export async function lastDays(days: number) {
  const { timezone } = await getSettings();
  const today = dateOnlyInTz(new Date(), timezone);
  return resolveRange({
    from: new Date(today.getTime() - (days - 1) * DAY).toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
  });
}
