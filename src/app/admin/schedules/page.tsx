import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UrlSelect } from "@/components/url-select";
import { DeleteScheduleButton } from "@/features/schedules/components/delete-schedule-button";
import { ScheduleDialog } from "@/features/schedules/components/schedule-dialog";
import { DAYS } from "@/features/schedules/schemas";
import { listSchedules } from "@/features/schedules/service";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/session";
import { formatMinutes12h, minutesToHHMM } from "@/lib/time";

export const metadata: Metadata = { title: "Class schedules" };

export default async function SchedulesPage({ searchParams }: PageProps<"/admin/schedules">) {
  await requireStaff("schedule:manage");
  const labs = await db.lab.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });
  const { lab } = await searchParams;
  const labId = typeof lab === "string" && labs.some((l) => l.id === lab) ? lab : labs[0]?.id;
  const schedules = labId ? await listSchedules(labId) : [];

  return (
    <>
      <PageHeader
        title="Class schedules"
        description="Regular classes held in each lab this semester. Reservations are blocked during them."
        actions={
          <div className="flex flex-col gap-2 sm:flex-row">
            {labId && (
              <UrlSelect
                param="lab"
                label="Lab"
                value={labId}
                options={labs.map((l) => ({ value: l.id, label: l.name }))}
              />
            )}
            <ScheduleDialog labs={labs} defaultLabId={labId} />
          </div>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DAYS.map((day, dow) => {
          const classes = schedules.filter((s) => s.dayOfWeek === dow);
          if (dow === 0 && classes.length === 0) return null; // hide empty Sundays
          return (
            <Card key={day} className="gap-3">
              <CardHeader>
                <CardTitle className="text-base">{day}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {classes.length === 0 && <p className="text-muted-foreground text-sm">No classes.</p>}
                {classes.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{c.courseCode}</div>
                      <div className="text-muted-foreground truncate text-xs">
                        {formatMinutes12h(c.startMinute)}–{formatMinutes12h(c.endMinute)} · {c.instructor}
                      </div>
                    </div>
                    <ScheduleDialog
                      labs={labs}
                      schedule={{
                        id: c.id,
                        labId: c.labId,
                        dayOfWeek: String(c.dayOfWeek),
                        startMinute: minutesToHHMM(c.startMinute),
                        endMinute: minutesToHHMM(c.endMinute),
                        courseCode: c.courseCode,
                        instructor: c.instructor,
                      }}
                    />
                    <DeleteScheduleButton id={c.id} label={c.courseCode} />
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
