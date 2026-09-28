import type { Metadata } from "next";
import { BarChart } from "@/components/charts/bar-chart";
import { DataTableToggle } from "@/components/charts/data-table-toggle";
import { PageHeader } from "@/components/layout/app-shell";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getStudentStats } from "@/features/points/queries";
import { getCurrentSemester } from "@/features/semesters/queries";
import { getSettings } from "@/features/settings/queries";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/session";

export const metadata: Metadata = { title: "My statistics" };

const hours = (minutes: number) => (minutes < 60 ? `${minutes} min` : `${(minutes / 60).toFixed(1)} h`);
// Hours once there are two or more; minutes before that, so short sit-ins don't round to 0.
const inHours = (rows: { minutes: number }[]) => Math.max(0, ...rows.map((r) => r.minutes)) >= 120;
const weekLabel = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", timeZone: "UTC" });

export default async function StatsPage() {
  const user = await requireStudent();
  const settings = await getSettings();
  const semester = await getCurrentSemester(settings.timezone);
  const [stats, me] = await Promise.all([
    getStudentStats(user.id, semester?.id ?? null),
    db.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { pointsBalance: true, lifetimePoints: true, remainingSessions: true },
    }),
  ]);

  const weekly = stats.weekly.map((w) => ({ label: weekLabel.format(new Date(w.weekStart)), value: w.sitIns }));
  const busiest = weekly.reduce((a, b) => (b.value > a.value ? b : a), weekly[0]);

  return (
    <>
      <PageHeader title="My statistics" description="How you've used the labs." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Sit-ins this semester" value={stats.thisSemester} hint={`${stats.total} in total`} />
        <StatCard
          label="Time in the lab"
          value={hours(stats.totalMinutes)}
          hint={`${hours(stats.averageMinutes)} per sit-in on average`}
        />
        <StatCard label="Points" value={me.pointsBalance} hint={`${me.lifetimePoints} earned in total`} />
        <StatCard label="Sessions left" value={me.remainingSessions} />
      </div>

      {stats.total === 0 ? (
        <p className="text-muted-foreground mt-6 text-sm">Your charts appear after your first completed sit-in.</p>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Sit-ins per week</CardTitle>
              <CardDescription>Last 12 weeks</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart
                data={weekly}
                unit="sit-ins"
                summary={`Sit-ins per week over the last 12 weeks. Busiest: ${busiest.value} in the week of ${busiest.label}.`}
              />
              <DataTableToggle columns={["Week of", "Sit-ins"]} rows={weekly.map((w) => [w.label, w.value])} />
            </CardContent>
          </Card>
          {(
            [
              ["By programming language", "Language", stats.byLanguage],
              ["By lab", "Lab", stats.byLab],
            ] as const
          ).map(([title, column, rows]) => (
            <Card key={title}>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{inHours(rows) ? "Hours" : "Minutes"} spent</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  layout="horizontal"
                  height={Math.max(120, rows.length * 36)}
                  data={rows.map((r) => ({
                    label: r.name,
                    value: inHours(rows) ? Math.round((r.minutes / 60) * 10) / 10 : r.minutes,
                    detail: `${r.sitIns} sit-in${r.sitIns === 1 ? "" : "s"}`,
                  }))}
                  unit={inHours(rows) ? "hours" : "minutes"}
                  summary={`${title}: ${rows.map((r) => `${r.name} ${hours(r.minutes)}`).join(", ")}.`}
                />
                <DataTableToggle columns={[column, "Time"]} rows={rows.map((r) => [r.name, hours(r.minutes)])} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
