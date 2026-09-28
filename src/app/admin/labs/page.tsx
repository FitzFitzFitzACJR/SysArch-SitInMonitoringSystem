import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LabFormDialog } from "@/features/labs/components/lab-form-dialog";
import { listLabsWithStats } from "@/features/labs/queries";
import { labHours } from "@/features/labs/rules";
import { getSettings } from "@/features/settings/queries";
import { can } from "@/lib/permissions";
import { requireStaff } from "@/lib/session";
import { formatMinutes12h } from "@/lib/time";

export const metadata: Metadata = { title: "Labs & computers" };

export default async function LabsPage() {
  const user = await requireStaff("computer:manage");
  const [labs, settings] = await Promise.all([listLabsWithStats(), getSettings()]);
  const defaultHours = `${formatMinutes12h(settings.labOpensAt)} – ${formatMinutes12h(settings.labClosesAt)}`;

  return (
    <>
      <PageHeader
        title="Labs & computers"
        description="Lock, unlock or flag computers, and manage each lab's layout and hours."
        actions={can(user.role, "lab:manage") && <LabFormDialog defaultHours={defaultHours} />}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {labs.map((lab) => {
          const hours = labHours(lab, settings);
          return (
            <Card key={lab.id} className="hover:bg-muted/40 relative transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <Link href={`/admin/labs/${lab.id}`} className="after:absolute after:inset-0">
                    {lab.name}
                  </Link>
                  <ChevronRight className="text-muted-foreground size-4" aria-hidden />
                </CardTitle>
                <CardDescription>
                  {formatMinutes12h(hours.opensAt)} – {formatMinutes12h(hours.closesAt)} · {lab.total} PCs
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {!lab.isActive && <Badge variant="destructive">Closed</Badge>}
                <Badge variant="secondary">{lab.available} available</Badge>
                {lab.inUse > 0 && <Badge variant="outline">{lab.inUse} in use</Badge>}
                {lab.locked > 0 && <Badge variant="outline">{lab.locked} locked</Badge>}
                {lab.maintenance > 0 && <Badge variant="outline">{lab.maintenance} maintenance</Badge>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
