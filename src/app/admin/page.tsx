import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/app-shell";
import { StatCard } from "@/components/stat-card";
import { getCurrentSemester } from "@/features/semesters/queries";
import { getSettings } from "@/features/settings/queries";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/session";

export const metadata: Metadata = { title: "Admin dashboard" };

export default async function AdminDashboard() {
  const user = await requireStaff();
  const settings = await getSettings();
  const [students, labs, computers, semester] = await Promise.all([
    db.user.count({ where: { role: "STUDENT", status: "ACTIVE" } }),
    db.lab.count({ where: { isActive: true } }),
    db.computer.count({ where: { lab: { isActive: true } } }),
    getCurrentSemester(settings.timezone),
  ]);

  return (
    <>
      <PageHeader title="Dashboard" description={`Signed in as ${user.name}`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active students" value={students} />
        <StatCard label="Labs" value={labs} />
        <StatCard label="Computers" value={computers} />
        <StatCard label="Current semester" value={<span className="text-lg">{semester?.name ?? "None"}</span>} />
      </div>
    </>
  );
}
