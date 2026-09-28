import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { ImportWizard } from "@/features/students/components/import-wizard";
import { listActiveCourses } from "@/features/students/queries";
import { requireStaff } from "@/lib/session";

export const metadata: Metadata = { title: "Import students" };

export default async function ImportStudentsPage() {
  await requireStaff("student:import");
  const courses = await listActiveCourses();

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
        <Link href="/admin/students">
          <ArrowLeft /> Students
        </Link>
      </Button>
      <PageHeader title="Import students" description="Add many students at once from a class list." />
      <ImportWizard courseCodes={courses.map((c) => c.code)} />
    </>
  );
}
