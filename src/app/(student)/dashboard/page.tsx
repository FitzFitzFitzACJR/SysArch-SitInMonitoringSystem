import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/app-shell";
import { StatCard } from "@/components/stat-card";
import { getCurrentSemester } from "@/features/semesters/queries";
import { getSettings } from "@/features/settings/queries";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function StudentDashboard() {
  const session = await requireStudent();
  const settings = await getSettings();
  const [student, semester] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: session.id },
      select: {
        firstName: true,
        remainingSessions: true,
        pointsBalance: true,
        lifetimePoints: true,
        yearLevel: true,
        course: { select: { code: true } },
      },
    }),
    getCurrentSemester(settings.timezone),
  ]);

  const pointsToNext = settings.pointsPerSession - (Math.max(student.pointsBalance, 0) % settings.pointsPerSession);

  return (
    <>
      <PageHeader
        title={`Hi, ${student.firstName}`}
        description={[
          student.course?.code && `${student.course.code} ${student.yearLevel ?? ""}`.trim(),
          semester?.name ?? "No active semester",
        ]
          .filter(Boolean)
          .join(" · ")}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Remaining sit-in sessions"
          value={student.remainingSessions}
          hint={student.remainingSessions === 0 ? "Ask the lab staff about extra sessions." : undefined}
        />
        <StatCard
          label="Behavior points"
          value={student.pointsBalance}
          hint={`${pointsToNext} more point${pointsToNext === 1 ? "" : "s"} until your next bonus session`}
        />
        <StatCard label="Lifetime points" value={student.lifetimePoints} />
      </div>
    </>
  );
}
