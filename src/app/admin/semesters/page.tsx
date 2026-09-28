import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SemesterDialog } from "@/features/semesters/components/semester-dialog";
import { SemesterRowActions } from "@/features/semesters/components/semester-row-actions";
import { listSemesters } from "@/features/semesters/service";
import { getSettings } from "@/features/settings/queries";
import { requireStaff } from "@/lib/session";
import { dateOnlyInTz } from "@/lib/time";

export const metadata: Metadata = { title: "Semesters" };

const fmt = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "UTC" });
const ymd = (d: Date) => d.toISOString().slice(0, 10);

export default async function SemestersPage() {
  await requireStaff("semester:manage");
  const [semesters, settings] = await Promise.all([listSemesters(), getSettings()]);
  const today = dateOnlyInTz(new Date(), settings.timezone);

  return (
    <>
      <PageHeader
        title="Semesters"
        description="Sessions reset automatically when a semester starts. Past semesters are kept as an archive for reports."
        actions={<SemesterDialog defaultSessions={settings.defaultSessions} />}
      />
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Semester</TableHead>
              <TableHead className="hidden sm:table-cell">Dates</TableHead>
              <TableHead className="text-right">Sessions</TableHead>
              <TableHead className="hidden text-right md:table-cell">Sit-ins</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {semesters.map((s) => {
              const current = s.startsOn <= today && s.endsOn >= today;
              const upcoming = s.startsOn > today;
              const used = s._count.sitIns + s._count.reservations + s._count.schedules > 0;
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-medium">{s.name}</div>
                    <div className="mt-1 flex gap-1">
                      {current && <Badge>Current</Badge>}
                      {upcoming && <Badge variant="outline">Upcoming</Badge>}
                      {!current && !upcoming && <Badge variant="secondary">Archived</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {fmt.format(s.startsOn)} – {fmt.format(s.endsOn)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{s.sessionAllotment}</TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">{s._count.sitIns}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      {s.endsOn >= today && (
                        <SemesterDialog
                          defaultSessions={settings.defaultSessions}
                          started={Boolean(s.resetAppliedAt)}
                          semester={{
                            id: s.id,
                            name: s.name,
                            startsOn: ymd(s.startsOn),
                            endsOn: ymd(s.endsOn),
                            sessionAllotment: String(s.sessionAllotment),
                          }}
                        />
                      )}
                      <SemesterRowActions
                        id={s.id}
                        name={s.name}
                        allotment={s.sessionAllotment}
                        canReset={current}
                        canDelete={!used && !s.resetAppliedAt}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
