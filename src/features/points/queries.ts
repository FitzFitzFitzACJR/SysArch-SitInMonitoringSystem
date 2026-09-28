import "server-only";
import { db } from "@/lib/db";
import { rankByScore } from "./ranking";

/**
 * Attendance leaderboard, derived from completed sit-ins (no separate table to keep in
 * sync, unlike the original). `semesterId` null = all time.
 */
export async function getLeaderboard(semesterId: string | null) {
  const counts = await db.sitIn.groupBy({
    by: ["studentId"],
    where: { status: "COMPLETED", ...(semesterId && { semesterId }) },
    _count: true,
  });
  if (counts.length === 0) return [];

  const students = await db.user.findMany({
    where: { id: { in: counts.map((c) => c.studentId) }, status: { not: "ARCHIVED" } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      photoUrl: true,
      yearLevel: true,
      course: { select: { code: true } },
    },
  });
  return rankByScore(
    students.map((s) => ({
      ...s,
      name: `${s.lastName}, ${s.firstName}`,
      score: counts.find((c) => c.studentId === s.id)!._count,
    })),
  );
}

export type LeaderboardRow = Awaited<ReturnType<typeof getLeaderboard>>[number];

const DAY = 86_400_000;

/** Everything on a student's statistics page. Minutes are counted from finished sit-ins. */
export async function getStudentStats(studentId: string, semesterId: string | null, weeks = 12) {
  const since = new Date(Date.now() - weeks * 7 * DAY);
  const [finished, semesterCount, activeCount] = await Promise.all([
    db.sitIn.findMany({
      where: { studentId, status: "COMPLETED", endedAt: { not: null } },
      select: {
        startedAt: true,
        endedAt: true,
        semesterId: true,
        lab: { select: { name: true } },
        language: { select: { name: true } },
      },
    }),
    semesterId ? db.sitIn.count({ where: { studentId, status: "COMPLETED", semesterId } }) : Promise.resolve(0),
    db.sitIn.count({ where: { studentId, status: "ACTIVE" } }),
  ]);

  const minutes = (s: { startedAt: Date; endedAt: Date | null }) =>
    Math.max(0, Math.round((s.endedAt!.getTime() - s.startedAt.getTime()) / 60_000));

  const totalMinutes = finished.reduce((sum, s) => sum + minutes(s), 0);
  const tally = (key: (s: (typeof finished)[number]) => string) => {
    const map = new Map<string, { sitIns: number; minutes: number }>();
    for (const s of finished) {
      const k = key(s);
      const cur = map.get(k) ?? { sitIns: 0, minutes: 0 };
      map.set(k, { sitIns: cur.sitIns + 1, minutes: cur.minutes + minutes(s) });
    }
    return [...map.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.minutes - a.minutes);
  };

  // Sit-ins per week for the last `weeks` weeks, oldest first, including empty weeks.
  const weekly = Array.from({ length: weeks }, (_, i) => {
    const start = new Date(since.getTime() + i * 7 * DAY);
    const end = new Date(start.getTime() + 7 * DAY);
    return {
      weekStart: start.toISOString().slice(0, 10),
      sitIns: finished.filter((s) => s.startedAt >= start && s.startedAt < end).length,
    };
  });

  return {
    total: finished.length,
    thisSemester: semesterCount,
    active: activeCount,
    totalMinutes,
    averageMinutes: finished.length ? Math.round(totalMinutes / finished.length) : 0,
    byLanguage: tally((s) => s.language.name),
    byLab: tally((s) => s.lab.name),
    weekly,
  };
}

export type StudentStats = Awaited<ReturnType<typeof getStudentStats>>;
