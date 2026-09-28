import { Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/app-shell";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnnouncementCard } from "@/features/announcements/components/announcement-card";
import { listAnnouncementsForStudent } from "@/features/announcements/service";
import { ReportIssueDialog } from "@/features/issues/components/report-issue-dialog";
import { getCurrentSemester } from "@/features/semesters/queries";
import { getSettings } from "@/features/settings/queries";
import { Countdown } from "@/features/sit-ins/components/countdown";
import { StudentQr } from "@/features/sit-ins/components/student-qr";
import { getActiveSitInFor } from "@/features/sit-ins/queries";
import { sweepIfStale } from "@/features/sit-ins/service";
import { db } from "@/lib/db";
import { dateTimeFormatter } from "@/lib/format";
import { requireStudent } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function StudentDashboard() {
  const session = await requireStudent();
  await sweepIfStale();
  const settings = await getSettings();
  const [student, semester, active, announcements] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: session.id },
      select: {
        firstName: true,
        idNumber: true,
        qrToken: true,
        remainingSessions: true,
        pointsBalance: true,
        lifetimePoints: true,
        yearLevel: true,
        course: { select: { code: true } },
      },
    }),
    getCurrentSemester(settings.timezone),
    getActiveSitInFor(session.id),
    listAnnouncementsForStudent(session.id, 3),
  ]);

  const pointsToNext = settings.pointsPerSession - (Math.max(student.pointsBalance, 0) % settings.pointsPerSession);
  const time = new Intl.DateTimeFormat("en-PH", { timeStyle: "short", timeZone: settings.timezone });

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

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="grid content-start gap-4">
          {active && (
            <Card className="border-sky-500/40 bg-sky-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="size-5" /> You&apos;re checked in
                </CardTitle>
                <CardDescription>
                  {active.lab.name}, PC {active.computer?.number} · {active.language.name} · since{" "}
                  {time.format(active.startedAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-lg">
                  <Countdown endsAt={active.endsAt.toISOString()} warnBeforeMinutes={settings.warnBeforeMinutes} />
                  <span className="text-muted-foreground text-sm"> · ends at {time.format(active.endsAt)}</span>
                </div>
                {active.computer && <ReportIssueDialog pcLabel={`PC ${active.computer.number}`} />}
              </CardContent>
            </Card>
          )}
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="Remaining sit-in sessions"
              value={student.remainingSessions}
              hint={student.remainingSessions === 0 ? "Ask the lab staff about extra sessions." : undefined}
            />
            <StatCard
              label="Behavior points"
              value={student.pointsBalance}
              hint={`${pointsToNext} more until your next bonus session`}
            />
            <StatCard label="Lifetime points" value={student.lifetimePoints} />
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Announcements</CardTitle>
              <Link href="/announcements" className="text-muted-foreground text-sm hover:underline">
                See all
              </Link>
            </CardHeader>
            <CardContent className="grid gap-3">
              {announcements.length === 0 && <p className="text-muted-foreground text-sm">Nothing new.</p>}
              {announcements.map((a) => (
                <AnnouncementCard key={a.id} a={a} dateFormat={dateTimeFormatter(settings.timezone)} />
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your check-in code</CardTitle>
          </CardHeader>
          <CardContent>
            <StudentQr token={student.qrToken} idNumber={student.idNumber} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
