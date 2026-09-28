import { FileDown, FileText } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/app-shell";
import { ListPagination } from "@/components/list-pagination";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportFilters } from "@/features/reports/components/report-filters";
import { minutesOf, reportFilterOptions, resolveRange, runReport } from "@/features/reports/queries";
import { MAX_EXPORT_ROWS, ReportFilterSchema } from "@/features/reports/schemas";
import { dateTimeFormatter } from "@/lib/format";
import { requireStaff } from "@/lib/session";

export const metadata: Metadata = { title: "Reports" };

const ymd = (d: Date) => d.toISOString().slice(0, 10);

export default async function ReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  await requireStaff("report:view");
  const raw = await searchParams;
  const filter = ReportFilterSchema.parse(raw);
  const [report, range, options] = await Promise.all([runReport(filter), resolveRange(filter), reportFilterOptions()]);
  const fmt = dateTimeFormatter(range.timezone);

  // Same filters for the export links (minus paging).
  const exportQuery = new URLSearchParams(
    Object.entries(raw).filter((e): e is [string, string] => typeof e[1] === "string" && e[0] !== "page"),
  ).toString();
  const hours = report.totalMinutes / 60;

  return (
    <>
      <PageHeader
        title="Reports"
        description="Sit-ins by date, lab, course, year level and language."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a href={`/api/reports/sit-ins/csv?${exportQuery}`} download>
                <FileDown /> CSV
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={`/api/reports/sit-ins/pdf?${exportQuery}`} download>
                <FileText /> PDF
              </a>
            </Button>
          </div>
        }
      />
      <ReportFilters
        from={ymd(range.fromDay)}
        to={ymd(range.toDay)}
        labs={options.labs.map((l) => ({ value: l.id, label: l.name }))}
        courses={options.courses.map((c) => ({ value: c.id, label: c.code }))}
        languages={options.languages.map((l) => ({ value: l.id, label: l.name }))}
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Sit-ins" value={report.total} />
        <StatCard
          label="Total time"
          value={hours >= 1 ? `${hours.toFixed(1)} h` : `${Math.round(report.totalMinutes)} min`}
        />
        <StatCard
          label="Average length"
          value={report.total ? `${Math.round(report.totalMinutes / report.total)} min` : "—"}
        />
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Started</TableHead>
              <TableHead>Student</TableHead>
              <TableHead className="hidden md:table-cell">Where</TableHead>
              <TableHead className="hidden lg:table-cell">Language</TableHead>
              <TableHead className="text-right">Minutes</TableHead>
              <TableHead className="hidden sm:table-cell">Outcome</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground h-24 text-center">
                  No sit-ins match these filters.
                </TableCell>
              </TableRow>
            )}
            {report.rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap">{fmt.format(r.startedAt)}</TableCell>
                <TableCell>
                  {r.student.lastName}, {r.student.firstName}
                  <div className="text-muted-foreground text-xs">
                    {r.student.idNumber} · {r.student.course?.code} {r.student.yearLevel}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {r.lab.name}, PC {r.computer?.number}
                </TableCell>
                <TableCell className="hidden lg:table-cell">{r.language.name}</TableCell>
                <TableCell className="text-right tabular-nums">{minutesOf(r) ?? "—"}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={r.status === "CANCELLED" ? "outline" : "secondary"}>{r.status.toLowerCase()}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <ListPagination
        page={filter.page}
        pageCount={report.pageCount}
        basePath="/admin/reports"
        params={Object.fromEntries(
          Object.entries(raw).filter((e): e is [string, string] => typeof e[1] === "string" && e[0] !== "page"),
        )}
      />
      {report.total > MAX_EXPORT_ROWS && (
        <p className="text-muted-foreground mt-2 text-xs">
          Exports include the first {MAX_EXPORT_ROWS} rows; narrow the filters for the rest.
        </p>
      )}
    </>
  );
}
