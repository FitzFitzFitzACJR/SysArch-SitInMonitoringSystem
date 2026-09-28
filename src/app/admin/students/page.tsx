import { FileUp } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/app-shell";
import { ListPagination } from "@/components/list-pagination";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserAvatar } from "@/components/user-avatar";
import { AddStudentDialog } from "@/features/students/components/add-student-dialog";
import { StudentFilters } from "@/features/students/components/student-filters";
import { listActiveCourses, listStudents } from "@/features/students/queries";
import { StudentListQuerySchema } from "@/features/students/schemas";
import { can } from "@/lib/permissions";
import { requireStaff } from "@/lib/session";

export const metadata: Metadata = { title: "Students" };

export default async function StudentsPage({ searchParams }: PageProps<"/admin/students">) {
  const user = await requireStaff("student:edit");
  const query = StudentListQuerySchema.parse(await searchParams);
  const [{ rows, total, pageCount }, courses] = await Promise.all([listStudents(query), listActiveCourses()]);

  return (
    <>
      <PageHeader
        title="Students"
        description={`${total} student${total === 1 ? "" : "s"}`}
        actions={
          <div className="flex gap-2">
            {can(user.role, "student:import") && (
              <Button variant="outline" asChild>
                <Link href="/admin/students/import">
                  <FileUp /> Import
                </Link>
              </Button>
            )}
            <AddStudentDialog courses={courses} />
          </div>
        }
      />
      <StudentFilters courses={courses} />

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead className="hidden md:table-cell">Course</TableHead>
              <TableHead className="text-right">Sessions</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Points</TableHead>
              <TableHead className="hidden lg:table-cell">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground h-24 text-center">
                  No students match these filters.
                </TableCell>
              </TableRow>
            )}
            {rows.map((s) => (
              <TableRow key={s.id} className="relative">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <UserAvatar firstName={s.firstName} lastName={s.lastName} photoUrl={s.photoUrl} />
                    <div className="min-w-0">
                      {/* The link's ::after covers the row, so the whole row is clickable. */}
                      <Link
                        href={`/admin/students/${s.id}`}
                        className="font-medium after:absolute after:inset-0 hover:underline"
                      >
                        {s.lastName}, {s.firstName}
                      </Link>
                      <div className="text-muted-foreground truncate text-xs">
                        {s.idNumber}
                        <span className="hidden sm:inline"> · {s.email}</span>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {s.course?.code} {s.yearLevel}
                </TableCell>
                <TableCell className="text-right tabular-nums">{s.remainingSessions}</TableCell>
                <TableCell className="hidden text-right tabular-nums sm:table-cell">{s.pointsBalance}</TableCell>
                <TableCell className="hidden lg:table-cell">
                  <StatusBadge status={s.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <ListPagination
        page={query.page}
        pageCount={pageCount}
        basePath="/admin/students"
        params={{
          q: query.q,
          courseId: query.courseId,
          yearLevel: query.yearLevel?.toString(),
          status: query.status === "ACTIVE" ? undefined : query.status,
        }}
      />
    </>
  );
}
