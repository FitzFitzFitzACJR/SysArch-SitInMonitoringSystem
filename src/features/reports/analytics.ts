import "server-only";
import { db } from "@/lib/db";
import { labHours } from "@/features/labs/rules";
import { getSettings } from "@/features/settings/queries";
import { rankByScore } from "@/features/points/ranking";
import { lastDays } from "./queries";

const DAY = 86_400_000;

/**
 * Everything on the admin analytics dashboard for a lab-local date range. Timestamps are
 * stored in UTC, so hour/weekday bucketing converts them to the lab's timezone in SQL.
 */
export async function getAnalytics(days: number) {
  const settings = await getSettings();
  const range = await lastDays(days);
  const { start, end, fromDay } = range;
  const tz = settings.timezone;

  const [daily, heat, byLanguage, labMinutes, labs, top] = await Promise.all([
    db.$queryRaw<{ day: Date; n: bigint }[]>`
      SELECT date_trunc('day', ("startedAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz}) AS day, count(*) AS n
      FROM "SitIn"
      WHERE "startedAt" >= ${start} AND "startedAt" < ${end} AND status <> 'CANCELLED'
      GROUP BY 1`,
    db.$queryRaw<{ dow: number; hour: number; n: bigint }[]>`
      SELECT extract(dow FROM ("startedAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::int AS dow,
             extract(hour FROM ("startedAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::int AS hour,
             count(*) AS n
      FROM "SitIn"
      WHERE "startedAt" >= ${start} AND "startedAt" < ${end} AND status <> 'CANCELLED'
      GROUP BY 1, 2`,
    db.sitIn.groupBy({
      by: ["languageId"],
      where: { startedAt: { gte: start, lt: end }, status: { not: "CANCELLED" } },
      _count: true,
    }),
    // PC-minutes used per lab (still-running sit-ins count up to now).
    db.$queryRaw<{ labId: string; minutes: number }[]>`
      SELECT "labId", sum(extract(epoch FROM (least(coalesce("endedAt", now() AT TIME ZONE 'UTC'), ${end}::timestamp) - greatest("startedAt", ${start}::timestamp))) / 60)::float AS minutes
      FROM "SitIn"
      WHERE "startedAt" < ${end} AND coalesce("endedAt", now() AT TIME ZONE 'UTC') > ${start} AND status <> 'CANCELLED'
      GROUP BY 1`,
    db.lab.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        opensAt: true,
        closesAt: true,
        _count: { select: { computers: { where: { state: { not: "LOCKED" } } } } },
      },
    }),
    db.sitIn.groupBy({
      by: ["studentId"],
      where: { startedAt: { gte: start, lt: end }, status: "COMPLETED" },
      _count: true,
      orderBy: { _count: { studentId: "desc" } },
      take: 10,
    }),
  ]);

  const languages = await db.language.findMany({ select: { id: true, name: true } });
  const students = await db.user.findMany({
    where: { id: { in: top.map((t) => t.studentId) } },
    select: { id: true, firstName: true, lastName: true, idNumber: true, course: { select: { code: true } } },
  });

  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const dailyMap = new Map(daily.map((d) => [dayKey(d.day), Number(d.n)]));

  return {
    days,
    from: fromDay,
    to: range.toDay,
    daily: Array.from({ length: days }, (_, i) => {
      const d = new Date(fromDay.getTime() + i * DAY);
      return { date: dayKey(d), sitIns: dailyMap.get(dayKey(d)) ?? 0 };
    }),
    heatmap: heat.map((h) => ({ dow: h.dow, hour: h.hour, n: Number(h.n) })),
    languages: byLanguage
      .map((l) => ({ name: languages.find((x) => x.id === l.languageId)?.name ?? "?", sitIns: l._count }))
      .sort((a, b) => b.sitIns - a.sitIns),
    // Utilisation = PC-minutes used ÷ PC-minutes available (usable PCs × daily opening
    // hours × days in range). It counts every calendar day, so closed days pull it down.
    utilization: labs.map((lab) => {
      const hours = labHours(lab, settings);
      const available = lab._count.computers * (hours.closesAt - hours.opensAt) * days;
      const used = labMinutes.find((m) => m.labId === lab.id)?.minutes ?? 0;
      return { name: lab.name, percent: available ? Math.min(100, (used / available) * 100) : 0, hoursUsed: used / 60 };
    }),
    topStudents: rankByScore(
      top.map((t) => {
        const s = students.find((x) => x.id === t.studentId)!;
        return { ...s, name: `${s.lastName}, ${s.firstName}`, score: t._count };
      }),
    ),
  };
}

/** Headline numbers for right now. */
export async function getLiveCounts() {
  const { start: startOfToday } = await lastDays(1);
  const [active, today, pending, issues, feedback] = await Promise.all([
    db.sitIn.count({ where: { status: "ACTIVE" } }),
    db.sitIn.count({ where: { startedAt: { gte: startOfToday }, status: { not: "CANCELLED" } } }),
    db.reservation.count({ where: { status: "PENDING" } }),
    db.computerIssue.count({ where: { status: { not: "RESOLVED" } } }),
    db.feedback.count({ where: { readAt: null } }),
  ]);
  return { active, today, pending, issues, feedback };
}
