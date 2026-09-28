import { FileDown } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/app-shell";
import { ListPagination } from "@/components/list-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AuditFilters } from "@/features/audit/components/audit-filters";
import { AuditFilterSchema, auditFilterOptions, listAudit } from "@/features/audit/queries";
import { resolveRange } from "@/features/reports/queries";
import { dateTimeFormatter } from "@/lib/format";
import { requireStaff } from "@/lib/session";

export const metadata: Metadata = { title: "Audit log" };

const ymd = (d: Date) => d.toISOString().slice(0, 10);

/** Compact "key: value" rendering of an entry's details; long values are shortened. */
function summarize(details: unknown): string {
  if (!details || typeof details !== "object") return "";
  return Object.entries(details as Record<string, unknown>)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
    .join(" · ")
    .slice(0, 300);
}

export default async function AuditPage({ searchParams }: PageProps<"/admin/audit">) {
  await requireStaff("audit:view");
  const raw = await searchParams;
  const filter = AuditFilterSchema.parse(raw);
  const [{ rows, total, pageCount }, options, range] = await Promise.all([
    listAudit(filter),
    auditFilterOptions(),
    resolveRange({ from: filter.from, to: filter.to }),
  ]);
  const fmt = dateTimeFormatter(range.timezone);
  const params = Object.fromEntries(
    Object.entries(raw).filter((e): e is [string, string] => typeof e[1] === "string" && e[0] !== "page"),
  );

  return (
    <>
      <PageHeader
        title="Audit log"
        description={`Every staff action, with who did it and when. ${total} entr${total === 1 ? "y" : "ies"} in this range.`}
        actions={
          <Button variant="outline" asChild>
            <a href={`/api/audit/csv?${new URLSearchParams(params).toString()}`} download>
              <FileDown /> CSV
            </a>
          </Button>
        }
      />
      <AuditFilters
        from={ymd(range.fromDay)}
        to={ymd(range.toDay)}
        areas={options.areas}
        actors={options.actors.map((a) => ({ value: a.id, label: `${a.firstName} ${a.lastName}` }))}
      />
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Who</TableHead>
              <TableHead>Action</TableHead>
              <TableHead className="hidden lg:table-cell">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground h-24 text-center">
                  Nothing recorded for these filters.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id} className="align-top">
                <TableCell className="whitespace-nowrap">
                  {fmt.format(r.createdAt)}
                  {r.ipAddress && <div className="text-muted-foreground text-xs">{r.ipAddress}</div>}
                </TableCell>
                <TableCell>
                  {r.actor.firstName} {r.actor.lastName}
                  <div className="text-muted-foreground text-xs">{r.actor.idNumber}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono">
                    {r.action}
                  </Badge>
                  <div className="text-muted-foreground mt-1 text-xs lg:hidden">{summarize(r.details)}</div>
                </TableCell>
                <TableCell className="text-muted-foreground hidden max-w-md text-xs break-words whitespace-normal lg:table-cell">
                  {summarize(r.details)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <ListPagination page={filter.page} pageCount={pageCount} basePath="/admin/audit" params={params} />
    </>
  );
}
