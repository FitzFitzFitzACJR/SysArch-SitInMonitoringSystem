import { writeAudit } from "@/features/audit/service";
import { toCsv } from "@/features/reports/csv";
import { tablePdf } from "@/features/reports/pdf";
import { minutesOf, reportRowsForExport, resolveRange } from "@/features/reports/queries";
import { ReportFilterSchema } from "@/features/reports/schemas";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { clientIp } from "@/lib/request";

export const maxDuration = 60;

// GET /api/reports/sit-ins/csv?from=…&to=…&labId=…  (same filters as the Reports page)
export async function GET(req: Request, ctx: RouteContext<"/api/reports/sit-ins/[format]">) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!can(session.user.role, "report:view")) return new Response("Forbidden", { status: 403 });

  const { format } = await ctx.params;
  if (format !== "csv" && format !== "pdf") return new Response("Unknown format", { status: 404 });

  const params = Object.fromEntries(new URL(req.url).searchParams);
  const filter = ReportFilterSchema.parse(params);
  const { page: _page, ...exportedFilter } = filter; // exports ignore paging
  void _page;
  const [{ rows, total, truncated }, range] = await Promise.all([reportRowsForExport(filter), resolveRange(filter)]);

  const dateTime = new Intl.DateTimeFormat("en-CA", {
    timeZone: range.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const fmt = (d: Date | null) => (d ? dateTime.format(d).replace(",", "") : "");
  const period = `${range.fromDay.toISOString().slice(0, 10)} to ${range.toDay.toISOString().slice(0, 10)}`;
  const filename = `sit-ins_${period.replace(" to ", "_")}.${format}`;

  // Exports carry personal data out of the system, so record who took what.
  await writeAudit(db, {
    actorId: session.user.id,
    action: `report.export.${format}`,
    entityType: "Report",
    details: { filter: exportedFilter, rows: rows.length },
    ipAddress: clientIp(req.headers),
  });

  const headers = { "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" };

  if (format === "csv") {
    const csv = toCsv(
      [
        "Started",
        "Ended",
        "Minutes",
        "ID number",
        "Last name",
        "First name",
        "Course",
        "Year",
        "Lab",
        "PC",
        "Language",
        "Purpose",
        "Status",
        "Ended by",
        "Rewarded",
      ],
      rows.map((r) => [
        fmt(r.startedAt),
        fmt(r.endedAt),
        minutesOf(r) ?? "",
        r.student.idNumber,
        r.student.lastName,
        r.student.firstName,
        r.student.course?.code ?? "",
        r.student.yearLevel ?? "",
        r.lab.name,
        r.computer?.number ?? "",
        r.language.name,
        r.purpose ?? "",
        r.status,
        r.endReason ?? "",
        r.rewarded ? "yes" : "no",
      ]),
    );
    return new Response(csv, { headers: { ...headers, "Content-Type": "text/csv; charset=utf-8" } });
  }

  const pdf = await tablePdf({
    title: "CCS Sit-In Report",
    subtitle: `${period} · ${total} sit-in${total === 1 ? "" : "s"} · generated ${fmt(new Date())}`,
    columns: [
      { header: "Started", width: 92 },
      { header: "Min", width: 36, align: "right" },
      { header: "ID number", width: 72 },
      { header: "Student", width: 150 },
      { header: "Course", width: 60 },
      { header: "Lab", width: 70 },
      { header: "PC", width: 30, align: "right" },
      { header: "Language", width: 70 },
      { header: "Purpose", width: 120 },
      { header: "Status", width: 70 },
    ],
    rows: rows.map((r) => [
      fmt(r.startedAt),
      String(minutesOf(r) ?? ""),
      r.student.idNumber,
      `${r.student.lastName}, ${r.student.firstName}`,
      `${r.student.course?.code ?? ""} ${r.student.yearLevel ?? ""}`.trim(),
      r.lab.name,
      String(r.computer?.number ?? ""),
      r.language.name,
      r.purpose ?? "",
      r.status.toLowerCase(),
    ]),
    footnote: truncated
      ? `Showing the first ${rows.length} of ${total} rows. Narrow the filters to export the rest.`
      : undefined,
  });
  return new Response(new Uint8Array(pdf), { headers: { ...headers, "Content-Type": "application/pdf" } });
}
