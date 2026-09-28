import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingForm } from "@/features/reservations/components/booking-form";
import { CancelReservationButton } from "@/features/reservations/components/cancel-reservation-button";
import { ReservationStatusBadge } from "@/features/reservations/components/reservation-status-badge";
import { listMyReservations } from "@/features/reservations/queries";
import { getSettings } from "@/features/settings/queries";
import { listSitInOptions } from "@/features/sit-ins/queries";
import { sweepIfStale } from "@/features/sit-ins/service";
import { requireStudent } from "@/lib/session";
import { dateOnlyInTz } from "@/lib/time";

export const metadata: Metadata = { title: "Reservations" };

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const day = new Intl.DateTimeFormat("en-PH", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

export default async function ReservationsPage() {
  const user = await requireStudent();
  await sweepIfStale(); // expire/no-show anything overdue before listing
  const [settings, options, mine] = await Promise.all([getSettings(), listSitInOptions(), listMyReservations(user.id)]);
  const today = dateOnlyInTz(new Date(), settings.timezone);
  const maxDate = new Date(today.getTime() + settings.reservationMaxDaysAhead * 86_400_000);

  return (
    <>
      <PageHeader title="Reservations" description="Book a lab computer ahead of time." />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Book a lab</CardTitle>
            <CardDescription>Up to {settings.reservationMaxDaysAhead} days ahead.</CardDescription>
          </CardHeader>
          <CardContent>
            <BookingForm
              labs={options.labs}
              languages={options.languages}
              minDate={ymd(today)}
              maxDate={ymd(maxDate)}
              requiresApproval={settings.requireReservationApproval}
            />
          </CardContent>
        </Card>

        <div className="grid content-start gap-6">
          <Card className="gap-3">
            <CardHeader>
              <CardTitle>Upcoming</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {mine.upcoming.length === 0 && <p className="text-muted-foreground text-sm">No upcoming bookings.</p>}
              {mine.upcoming.map((r) => (
                <div key={r.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">
                        {day.format(r.date)} · {r.timeSlot.label}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {r.lab.name}
                        {r.computer ? `, PC ${r.computer.number}` : ", any PC"} · {r.language.name}
                      </div>
                    </div>
                    <ReservationStatusBadge status={r.status} />
                  </div>
                  <div className="mt-1 flex justify-end">
                    <CancelReservationButton id={r.id} label={`${day.format(r.date)}, ${r.timeSlot.label}`} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="gap-3">
            <CardHeader>
              <CardTitle>Past</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {mine.past.length === 0 && <p className="text-muted-foreground text-sm">Nothing yet.</p>}
              {mine.past.map((r) => (
                <div key={r.id} className="flex items-start justify-between gap-2 text-sm">
                  <div>
                    {day.format(r.date)} · {r.timeSlot.label}
                    <div className="text-muted-foreground text-xs">
                      {r.lab.name}
                      {r.decisionNote && ` · ${r.decisionNote}`}
                    </div>
                  </div>
                  <ReservationStatusBadge status={r.status} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
