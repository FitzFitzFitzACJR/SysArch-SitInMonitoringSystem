import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UrlSelect } from "@/components/url-select";
import { UserAvatar } from "@/components/user-avatar";
import { CancelReservationButton } from "@/features/reservations/components/cancel-reservation-button";
import { DecideButtons } from "@/features/reservations/components/decide-buttons";
import { ReservationStatusBadge } from "@/features/reservations/components/reservation-status-badge";
import { getWeekOverview, listPendingReservations, listSlotBookings } from "@/features/reservations/queries";
import { getSettings } from "@/features/settings/queries";
import { sweepIfStale } from "@/features/sit-ins/service";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/session";
import { dateOnlyInTz } from "@/lib/time";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Reservations" };

const DAY_MS = 86_400_000;
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const parseYmd = (v: unknown) =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00Z`) : null;
const dayFmt = new Intl.DateTimeFormat("en-PH", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

export default async function AdminReservationsPage({ searchParams }: PageProps<"/admin/reservations">) {
  await requireStaff("reservation:decide");
  await sweepIfStale();
  const params = await searchParams;
  const settings = await getSettings();
  const today = dateOnlyInTz(new Date(), settings.timezone);

  const labs = await db.lab.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });
  const labId = typeof params.lab === "string" && labs.some((l) => l.id === params.lab) ? params.lab : labs[0]?.id;

  // Calendar: Monday-based week containing `week` (default: this week).
  const anchor = parseYmd(params.week) ?? today;
  const monday = new Date(anchor.getTime() - ((anchor.getUTCDay() + 6) % 7) * DAY_MS);
  const days = Array.from({ length: 7 }, (_, i) => new Date(monday.getTime() + i * DAY_MS));
  const selectedDay = parseYmd(params.day);
  const selectedSlot = typeof params.slot === "string" ? params.slot : null;

  const [pending, week, slotBookings] = await Promise.all([
    listPendingReservations(),
    labId ? getWeekOverview(labId, days) : null,
    labId && selectedDay && selectedSlot ? listSlotBookings(labId, selectedDay, selectedSlot) : [],
  ]);

  const link = (overrides: Record<string, string | null>) => {
    const q = new URLSearchParams();
    const merged = {
      lab: labId ?? null,
      week: ymd(monday),
      day: params.day,
      slot: params.slot,
      ...overrides,
    } as Record<string, unknown>;
    for (const [k, v] of Object.entries(merged)) if (typeof v === "string" && v) q.set(k, v);
    return `/admin/reservations?${q.toString()}`;
  };

  return (
    <>
      <PageHeader
        title="Reservations"
        description={`${pending.length} request${pending.length === 1 ? "" : "s"} waiting for review`}
      />

      <div className="grid gap-6">
        <Card className="gap-0 pb-0">
          <CardHeader className="pb-4">
            <CardTitle>Waiting for review</CardTitle>
            <CardDescription>
              Oldest slot first. Requests not reviewed before their slot starts expire automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Student</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead className="hidden md:table-cell">Where</TableHead>
                  <TableHead className="hidden lg:table-cell">Purpose</TableHead>
                  <TableHead className="pr-6 text-right">
                    <span className="sr-only">Decision</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground h-20 text-center">
                      Nothing to review.
                    </TableCell>
                  </TableRow>
                )}
                {pending.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          firstName={r.student.firstName}
                          lastName={r.student.lastName}
                          photoUrl={r.student.photoUrl}
                        />
                        <div>
                          <Link href={`/admin/students/${r.student.id}`} className="font-medium hover:underline">
                            {r.student.firstName} {r.student.lastName}
                          </Link>
                          <div className="text-muted-foreground text-xs">
                            {r.student.idNumber} · {r.student.remainingSessions} session(s) left
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {dayFmt.format(r.date)}
                      <div className="text-muted-foreground text-xs">{r.timeSlot.label}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {r.lab.name}
                      <div className="text-muted-foreground text-xs">
                        {r.computer ? `PC ${r.computer.number}` : "Any PC"}
                      </div>
                    </TableCell>
                    <TableCell className="hidden max-w-64 lg:table-cell">
                      <div className="truncate">{r.purpose}</div>
                      <div className="text-muted-foreground text-xs">{r.language.name}</div>
                    </TableCell>
                    <TableCell className="pr-6">
                      <DecideButtons id={r.id} studentName={r.student.firstName} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {week && labId && (
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Calendar</CardTitle>
                <CardDescription>
                  Places held per slot out of {week.capacity} available PCs. Select a cell to see who booked.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <UrlSelect
                  param="lab"
                  label="Lab"
                  value={labId}
                  options={labs.map((l) => ({ value: l.id, label: l.name }))}
                />
                <Button variant="outline" size="icon" asChild aria-label="Previous week">
                  <Link href={link({ week: ymd(new Date(monday.getTime() - 7 * DAY_MS)), day: null, slot: null })}>
                    <ChevronLeft />
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={link({ week: ymd(today), day: null, slot: null })}>Today</Link>
                </Button>
                <Button variant="outline" size="icon" asChild aria-label="Next week">
                  <Link href={link({ week: ymd(new Date(monday.getTime() + 7 * DAY_MS)), day: null, slot: null })}>
                    <ChevronRight />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[40rem] border-separate border-spacing-1 text-sm">
                  <thead>
                    <tr>
                      <th className="text-muted-foreground w-28 text-left text-xs font-normal">Slot</th>
                      {days.map((d) => (
                        <th
                          key={ymd(d)}
                          className={cn("text-xs font-medium", d.getTime() === today.getTime() && "text-primary")}
                        >
                          {dayFmt.format(d)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {week.slots.map((slot, si) => (
                      <tr key={slot.id}>
                        <th className="text-muted-foreground text-left text-xs font-normal whitespace-nowrap">
                          {slot.label}
                        </th>
                        {days.map((d, di) => {
                          const cell = week.cells[di][si];
                          const held = cell.pending + cell.approved;
                          const selected = selectedSlot === slot.id && selectedDay?.getTime() === d.getTime();
                          const past = d < today;
                          return (
                            <td key={ymd(d)} className="p-0">
                              {cell.classCode ? (
                                <div className="bg-muted text-muted-foreground rounded-md px-2 py-2 text-center text-xs">
                                  {cell.classCode}
                                </div>
                              ) : (
                                <Link
                                  href={link({ day: ymd(d), slot: slot.id })}
                                  scroll={false}
                                  aria-current={selected ? "true" : undefined}
                                  aria-label={`${dayFmt.format(d)} ${slot.label}: ${held} of ${week.capacity} held${cell.pending ? `, ${cell.pending} pending` : ""}`}
                                  className={cn(
                                    "block rounded-md border px-2 py-2 text-center text-xs tabular-nums transition hover:brightness-95",
                                    held === 0 && "text-muted-foreground",
                                    held > 0 && "border-sky-500/40 bg-sky-500/10",
                                    held >= week.capacity && "border-rose-500/50 bg-rose-500/15",
                                    past && "opacity-50",
                                    selected && "ring-primary ring-2",
                                  )}
                                >
                                  {held}/{week.capacity}
                                  {cell.pending > 0 && (
                                    <span className="ml-1 text-amber-600 dark:text-amber-400">·{cell.pending}?</span>
                                  )}
                                </Link>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-muted-foreground text-xs">
                <span className="text-amber-600 dark:text-amber-400">·n?</span> = requests awaiting review. Grey cells
                are classes.
              </p>

              {selectedDay && selectedSlot && (
                <div className="rounded-lg border">
                  <div className="border-b px-4 py-3 text-sm font-medium">
                    {dayFmt.format(selectedDay)} · {week.slots.find((s) => s.id === selectedSlot)?.label}
                  </div>
                  {slotBookings.length === 0 ? (
                    <p className="text-muted-foreground px-4 py-6 text-center text-sm">No bookings for this slot.</p>
                  ) : (
                    <ul className="divide-y">
                      {slotBookings.map((b) => (
                        <li key={b.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                          <div className="min-w-0 flex-1">
                            <Link href={`/admin/students/${b.student.id}`} className="font-medium hover:underline">
                              {b.student.firstName} {b.student.lastName}
                            </Link>
                            <span className="text-muted-foreground">
                              {" "}
                              · {b.computer ? `PC ${b.computer.number}` : "Any PC"} · {b.language.name}
                            </span>
                          </div>
                          <ReservationStatusBadge status={b.status} />
                          {(b.status === "PENDING" || b.status === "APPROVED") && (
                            <CancelReservationButton id={b.id} label={`${b.student.firstName}'s booking`} byStaff />
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
