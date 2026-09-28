import type { Metadata } from "next";
import Link from "next/link";
import { BarChart } from "@/components/charts/bar-chart";
import { DataTableToggle } from "@/components/charts/data-table-toggle";
import { Heatmap } from "@/components/charts/heatmap";
import { PageHeader } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UrlSelect } from "@/components/url-select";
import { getAnalytics, getLiveCounts } from "@/features/reports/analytics";
import { getSettings } from "@/features/settings/queries";
import { sweepIfStale } from "@/features/sit-ins/service";
import { can } from "@/lib/permissions";
import { requireStaff } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

const RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];
const dayLabel = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", timeZone: "UTC" });

export default async function AdminDashboard({ searchParams }: PageProps<"/admin">) {
  const user = await requireStaff();
  await sweepIfStale();
  const { range } = await searchParams;
  const days = RANGES.some((r) => r.value === range) ? Number(range) : 30;
  const [live, a, settings] = await Promise.all([getLiveCounts(), getAnalytics(days), getSettings()]);

  const tiles = [
    { label: "In the lab now", value: live.active, href: "/admin/sit-ins" },
    { label: "Sit-ins today", value: live.today, href: "/admin/sit-ins" },
    { label: "Bookings to review", value: live.pending, href: "/admin/reservations" },
    { label: "Open computer issues", value: live.issues, href: "/admin/issues" },
    { label: "Unread feedback", value: live.feedback, href: "/admin/feedback" },
  ];
  const daily = a.daily.map((d) => ({ label: dayLabel.format(new Date(d.date)), value: d.sitIns }));
  const total = daily.reduce((s, d) => s + d.value, 0);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user.name.split(" ")[0]}.`}
        actions={<UrlSelect param="range" label="Period" value={String(days)} options={RANGES} />}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="hover:bg-muted/50 rounded-xl border p-4 transition-colors">
            <div className="text-muted-foreground text-sm">{t.label}</div>
            <div className="mt-1 text-3xl font-semibold tabular-nums">{t.value}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sit-ins per day</CardTitle>
            <CardDescription>
              {total} in the {RANGES.find((r) => r.value === String(days))?.label.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart data={daily} unit="sit-ins" summary={`Sit-ins per day: ${total} in total over ${days} days.`} />
            <DataTableToggle columns={["Day", "Sit-ins"]} rows={daily.map((d) => [d.label, d.value])} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Peak hours</CardTitle>
            <CardDescription>When sit-ins start, by weekday and hour</CardDescription>
          </CardHeader>
          <CardContent>
            <Heatmap
              cells={a.heatmap}
              // Opening hours, widened to include any hour that actually has sit-ins.
              fromHour={Math.min(Math.floor(settings.labOpensAt / 60), ...a.heatmap.map((h) => h.hour))}
              toHour={Math.max(Math.ceil(settings.labClosesAt / 60), ...a.heatmap.map((h) => h.hour + 1))}
              unit="sit-ins"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Programming languages</CardTitle>
            <CardDescription>Sit-ins per language</CardDescription>
          </CardHeader>
          <CardContent>
            {a.languages.length === 0 ? (
              <p className="text-muted-foreground text-sm">No sit-ins in this period.</p>
            ) : (
              <>
                <BarChart
                  layout="horizontal"
                  height={Math.max(120, a.languages.length * 36)}
                  data={a.languages.map((l) => ({ label: l.name, value: l.sitIns }))}
                  unit="sit-ins"
                  summary={`Sit-ins per language: ${a.languages.map((l) => `${l.name} ${l.sitIns}`).join(", ")}.`}
                />
                <DataTableToggle columns={["Language", "Sit-ins"]} rows={a.languages.map((l) => [l.name, l.sitIns])} />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lab utilization</CardTitle>
            <CardDescription>Share of PC-hours in use during opening hours</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              layout="horizontal"
              height={Math.max(120, a.utilization.length * 36)}
              data={a.utilization.map((u) => ({
                label: u.name,
                value: Math.round(u.percent * 10) / 10,
                detail: `${u.hoursUsed.toFixed(1)} PC-hours`,
              }))}
              unit="%"
              summary={`Lab utilization: ${a.utilization.map((u) => `${u.name} ${u.percent.toFixed(1)}%`).join(", ")}.`}
            />
            <DataTableToggle
              columns={["Lab", "Utilization"]}
              rows={a.utilization.map((u) => [u.name, `${u.percent.toFixed(1)}%`])}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Most active students</CardTitle>
              <CardDescription>Completed sit-ins in this period</CardDescription>
            </div>
            {can(user.role, "report:view") && (
              <Link href="/admin/reports" className="text-muted-foreground text-sm hover:underline">
                Full reports
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {a.topStudents.length === 0 ? (
              <p className="text-muted-foreground text-sm">No completed sit-ins in this period.</p>
            ) : (
              <ol className="grid gap-2 sm:grid-cols-2">
                {a.topStudents.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground w-6 text-right tabular-nums">{s.rank}.</span>
                    <Link href={`/admin/students/${s.id}`} className="flex-1 hover:underline">
                      {s.firstName} {s.lastName}
                      <span className="text-muted-foreground"> · {s.course?.code}</span>
                    </Link>
                    <span className="tabular-nums">{s.score}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
