import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserAvatar } from "@/components/user-avatar";
import { getSettings } from "@/features/settings/queries";
import { CheckInConsole } from "@/features/sit-ins/components/check-in-console";
import { Countdown } from "@/features/sit-ins/components/countdown";
import { SitInActions } from "@/features/sit-ins/components/sit-in-actions";
import { listActiveSitIns, listFinishedSince, listSitInOptions } from "@/features/sit-ins/queries";
import { sweepIfStale } from "@/features/sit-ins/service";
import { dateTimeFormatter } from "@/lib/format";
import { requireStaff } from "@/lib/session";
import { dateOnlyInTz, localTimeToInstant } from "@/lib/time";

export const metadata: Metadata = { title: "Sit-ins" };

const END_LABELS = { STAFF: "Ended by staff", TIME_LIMIT: "Time limit", LAB_CLOSING: "Lab closed" } as const;

export default async function SitInsPage() {
  await requireStaff("sitIn:manage");
  await sweepIfStale(); // close anything past its limit before showing the list
  const settings = await getSettings();
  const startOfToday = localTimeToInstant(dateOnlyInTz(new Date(), settings.timezone), 0, settings.timezone);
  const [active, finished, options] = await Promise.all([
    listActiveSitIns(),
    listFinishedSince(startOfToday),
    listSitInOptions(),
  ]);
  const fmt = dateTimeFormatter(settings.timezone);
  const time = new Intl.DateTimeFormat("en-PH", { timeStyle: "short", timeZone: settings.timezone });

  return (
    <>
      <PageHeader title="Sit-ins" description={`${active.length} active right now`} />
      <div className="grid gap-6">
        <CheckInConsole
          labs={options.labs}
          languages={options.languages}
          rewardPoints={settings.sitInRewardPoints}
          warnBeforeMinutes={settings.warnBeforeMinutes}
        />

        <Card className="gap-0 pb-0">
          <CardHeader className="pb-4">
            <CardTitle>Active sit-ins</CardTitle>
            <CardDescription>Soonest to finish first. Sit-ins past their limit end automatically.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Student</TableHead>
                  <TableHead className="hidden sm:table-cell">Where</TableHead>
                  <TableHead className="hidden md:table-cell">Started</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="pr-6 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {active.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground h-20 text-center">
                      Nobody is sitting in right now.
                    </TableCell>
                  </TableRow>
                )}
                {active.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          firstName={s.student.firstName}
                          lastName={s.student.lastName}
                          photoUrl={s.student.photoUrl}
                        />
                        <div>
                          <Link href={`/admin/students/${s.student.id}`} className="font-medium hover:underline">
                            {s.student.firstName} {s.student.lastName}
                          </Link>
                          <div className="text-muted-foreground text-xs">
                            {s.student.idNumber}
                            <span className="sm:hidden">
                              {" "}
                              · {s.lab.name}, PC {s.computer?.number}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {s.lab.name}, PC {s.computer?.number}
                      <div className="text-muted-foreground text-xs">{s.language.name}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{time.format(s.startedAt)}</TableCell>
                    <TableCell>
                      <Countdown endsAt={s.endsAt.toISOString()} warnBeforeMinutes={settings.warnBeforeMinutes} />
                    </TableCell>
                    <TableCell className="pr-6">
                      <SitInActions
                        sitInId={s.id}
                        studentName={s.student.firstName}
                        rewardPoints={settings.sitInRewardPoints}
                        compact
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="gap-0 pb-0">
          <CardHeader className="pb-4">
            <CardTitle>Finished today</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Student</TableHead>
                  <TableHead className="hidden sm:table-cell">Where</TableHead>
                  <TableHead className="hidden sm:table-cell">Time</TableHead>
                  <TableHead className="pr-6">Outcome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finished.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground h-20 text-center">
                      No finished sit-ins yet today.
                    </TableCell>
                  </TableRow>
                )}
                {finished.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="pl-6">
                      {s.student.firstName} {s.student.lastName}
                      <div className="text-muted-foreground text-xs">
                        {s.student.idNumber}
                        <span className="sm:hidden">
                          {" "}
                          · {time.format(s.startedAt)}–{s.endedAt ? time.format(s.endedAt) : ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {s.lab.name}, PC {s.computer?.number}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap sm:table-cell">
                      {time.format(s.startedAt)} – {s.endedAt ? time.format(s.endedAt) : ""}
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex flex-wrap gap-1">
                        {s.status === "CANCELLED" ? (
                          <Badge variant="outline">Cancelled</Badge>
                        ) : (
                          <Badge variant="secondary">{s.endReason ? END_LABELS[s.endReason] : "Ended"}</Badge>
                        )}
                        {s.rewarded && <Badge>+points</Badge>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <p className="text-muted-foreground mt-4 text-xs">Updated {fmt.format(new Date())}</p>
    </>
  );
}
