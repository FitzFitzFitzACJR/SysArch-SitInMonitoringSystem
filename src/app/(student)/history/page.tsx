import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/app-shell";
import { ListPagination } from "@/components/list-pagination";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSettings } from "@/features/settings/queries";
import { listStudentSitIns } from "@/features/sit-ins/queries";
import { requireStudent } from "@/lib/session";

export const metadata: Metadata = { title: "Sit-in history" };

const OUTCOME = {
  STAFF: "Checked out",
  TIME_LIMIT: "Time limit reached",
  LAB_CLOSING: "Lab closed",
} as const;

export default async function HistoryPage({ searchParams }: PageProps<"/history">) {
  const user = await requireStudent();
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const [{ rows, total, pageCount }, settings] = await Promise.all([listStudentSitIns(user.id, page), getSettings()]);
  const date = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: settings.timezone });
  const time = new Intl.DateTimeFormat("en-PH", { timeStyle: "short", timeZone: settings.timezone });
  const minutes = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 60_000);

  return (
    <>
      <PageHeader title="Sit-in history" description={`${total} sit-in${total === 1 ? "" : "s"} in total`} />
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Lab</TableHead>
              <TableHead className="hidden sm:table-cell">Language</TableHead>
              <TableHead className="text-right">Minutes</TableHead>
              <TableHead className="hidden md:table-cell">Outcome</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground h-24 text-center">
                  No sit-ins yet. Show your QR code at the lab to check in.
                </TableCell>
              </TableRow>
            )}
            {rows.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="whitespace-nowrap">
                  {date.format(s.startedAt)}
                  <div className="text-muted-foreground text-xs">
                    {time.format(s.startedAt)}
                    {s.endedAt && ` – ${time.format(s.endedAt)}`}
                  </div>
                </TableCell>
                <TableCell>
                  {s.lab.name}
                  <div className="text-muted-foreground text-xs">PC {s.computer?.number}</div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{s.language.name}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {s.status === "ACTIVE" ? "—" : s.endedAt ? minutes(s.startedAt, s.endedAt) : "—"}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {s.status === "ACTIVE" && <Badge>In progress</Badge>}
                    {s.status === "CANCELLED" && <Badge variant="outline">Cancelled · refunded</Badge>}
                    {s.status === "COMPLETED" && (
                      <Badge variant="secondary">{s.endReason ? OUTCOME[s.endReason] : "Completed"}</Badge>
                    )}
                    {s.rewarded && <Badge variant="outline">+points</Badge>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <ListPagination page={page} pageCount={pageCount} basePath="/history" params={{}} />
    </>
  );
}
