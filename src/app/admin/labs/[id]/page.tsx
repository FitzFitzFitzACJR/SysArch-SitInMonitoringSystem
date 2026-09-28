import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ComputerGrid } from "@/features/labs/components/computer-grid";
import { LabFormDialog } from "@/features/labs/components/lab-form-dialog";
import { ResizeLabForm } from "@/features/labs/components/resize-lab-form";
import { getLabWithComputers } from "@/features/labs/queries";
import { labHours } from "@/features/labs/rules";
import { getSettings } from "@/features/settings/queries";
import { can } from "@/lib/permissions";
import { requireStaff } from "@/lib/session";
import { formatMinutes12h, minutesToHHMM } from "@/lib/time";

export const metadata: Metadata = { title: "Lab" };

export default async function LabPage({ params }: PageProps<"/admin/labs/[id]">) {
  const user = await requireStaff("computer:manage");
  const { id } = await params;
  const [lab, settings] = await Promise.all([getLabWithComputers(id), getSettings()]);
  if (!lab) notFound();

  const hours = labHours(lab, settings);
  const canEditLab = can(user.role, "lab:manage");
  const defaultHours = `${formatMinutes12h(settings.labOpensAt)} – ${formatMinutes12h(settings.labClosesAt)}`;

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
        <Link href="/admin/labs">
          <ArrowLeft /> Labs
        </Link>
      </Button>
      <PageHeader
        title={lab.name}
        description={`${formatMinutes12h(hours.opensAt)} – ${formatMinutes12h(hours.closesAt)}${lab.opensAt == null ? " (default hours)" : ""} · ${lab.computers.length} computers`}
        actions={
          <div className="flex items-center gap-2">
            {!lab.isActive && <Badge variant="destructive">Closed</Badge>}
            {canEditLab && (
              <LabFormDialog
                defaultHours={defaultHours}
                lab={{
                  id: lab.id,
                  code: lab.code,
                  name: lab.name,
                  gridColumns: lab.gridColumns,
                  opensAt: lab.opensAt == null ? "" : minutesToHHMM(lab.opensAt),
                  closesAt: lab.closesAt == null ? "" : minutesToHHMM(lab.closesAt),
                  isActive: lab.isActive,
                }}
              />
            )}
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Computers</CardTitle>
          <CardDescription>Select computers to lock, unlock or flag for maintenance.</CardDescription>
        </CardHeader>
        <CardContent>
          <ComputerGrid
            labId={lab.id}
            columns={lab.gridColumns}
            canManage={can(user.role, "computer:manage")}
            computers={lab.computers.map((pc) => {
              const student = pc.sitIns[0]?.student;
              return {
                id: pc.id,
                number: pc.number,
                state: pc.state,
                note: pc.note,
                user: student ? { name: `${student.firstName} ${student.lastName}`, idNumber: student.idNumber } : null,
              };
            })}
          />
        </CardContent>
      </Card>

      {canEditLab && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Layout</CardTitle>
            <CardDescription>
              Add PCs, or remove the highest-numbered ones. PCs with history can&apos;t be removed; flag them for
              maintenance instead.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResizeLabForm labId={lab.id} count={lab.computers.length} />
          </CardContent>
        </Card>
      )}
    </>
  );
}
