import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/app-shell";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AwardDialog } from "@/features/points/components/award-dialog";
import { LEDGER_REASON_LABELS } from "@/features/points/labels";
import { getSessionAllotment } from "@/features/semesters/queries";
import { getSettings } from "@/features/settings/queries";
import { dateTimeFormatter } from "@/lib/format";
import { StudentAdminActions, StudentPhoto } from "@/features/students/components/student-admin-panel";
import { StudentForm } from "@/features/students/components/student-form";
import { getStudentDetail, listActiveCourses } from "@/features/students/queries";
import { can } from "@/lib/permissions";
import { requireStaff } from "@/lib/session";

export const metadata: Metadata = { title: "Student" };

export default async function StudentDetailPage({ params }: PageProps<"/admin/students/[id]">) {
  const user = await requireStaff("student:edit");
  const { id } = await params;
  const [student, courses, allotment] = await Promise.all([
    getStudentDetail(id),
    listActiveCourses(),
    getSessionAllotment(),
  ]);
  if (!student) notFound();
  const settings = await getSettings();
  const dateFormat = dateTimeFormatter(settings.timezone);

  const hasHistory = student._count.sitIns + student._count.reservations > 0;
  const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
        <Link href="/admin/students">
          <ArrowLeft /> Students
        </Link>
      </Button>
      <PageHeader
        title={`${student.firstName} ${student.lastName}`}
        description={`${student.idNumber} · ${student.course?.code ?? "No course"} ${student.yearLevel ?? ""}`}
        actions={<StatusBadge status={student.status} />}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Remaining sessions" value={student.remainingSessions} />
        <StatCard
          label="Points balance"
          value={student.pointsBalance}
          hint={`${student.lifetimePoints} earned in total`}
        />
        <StatCard
          label="Sit-ins"
          value={student._count.sitIns}
          hint={`${student._count.reservations} reservation(s)`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <StudentPhoto
              student={{
                id: student.id,
                firstName: student.firstName,
                lastName: student.lastName,
                photoUrl: student.photoUrl,
              }}
            />
            <StudentForm
              courses={courses}
              student={{
                id: student.id,
                idNumber: student.idNumber,
                firstName: student.firstName,
                middleName: student.middleName ?? "",
                lastName: student.lastName,
                email: student.email,
                courseId: student.courseId ?? "",
                yearLevel: student.yearLevel ? String(student.yearLevel) : "",
              }}
            />
          </CardContent>
        </Card>

        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                {student.passwordPending
                  ? "Hasn't set a password yet."
                  : student.lastLoginAt
                    ? `Last signed in ${dateFormat.format(student.lastLoginAt)}`
                    : "Never signed in."}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {can(user.role, "points:award") && student.status !== "ARCHIVED" && (
                <AwardDialog
                  studentId={student.id}
                  studentName={student.firstName}
                  pointsPerSession={settings.pointsPerSession}
                />
              )}
              <StudentAdminActions
                student={{
                  id: student.id,
                  firstName: student.firstName,
                  lastName: student.lastName,
                  photoUrl: student.photoUrl,
                  status: student.status,
                  remainingSessions: student.remainingSessions,
                  hasHistory,
                  passwordPending: student.passwordPending,
                }}
                allotment={allotment.sessions}
                canArchive={user.role === "SUPER_ADMIN"}
                canDelete={can(user.role, "student:delete")}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Points & sessions history</CardTitle>
          <CardDescription>The 10 most recent changes.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">When</TableHead>
                <TableHead>What</TableHead>
                <TableHead className="text-right">Sessions</TableHead>
                <TableHead className="pr-6 text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {student.pointsLog.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="pl-6 whitespace-nowrap">{dateFormat.format(entry.createdAt)}</TableCell>
                  <TableCell>
                    {LEDGER_REASON_LABELS[entry.reason]}
                    <div className="text-muted-foreground text-xs">
                      {entry.note}
                      {entry.actor && ` · by ${entry.actor.firstName} ${entry.actor.lastName}`}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {entry.sessionsDelta ? signed(entry.sessionsDelta) : "—"}
                  </TableCell>
                  <TableCell className="pr-6 text-right tabular-nums">
                    {entry.pointsDelta ? signed(entry.pointsDelta) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
