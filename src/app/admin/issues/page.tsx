import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UrlSelect } from "@/components/url-select";
import { IssueActions } from "@/features/issues/components/issue-actions";
import { ISSUE_CATEGORY_LABELS } from "@/features/issues/schemas";
import { listIssues } from "@/features/issues/service";
import { getSettings } from "@/features/settings/queries";
import { dateTimeFormatter } from "@/lib/format";
import { requireStaff } from "@/lib/session";

export const metadata: Metadata = { title: "Computer issues" };

const VIEWS = [
  { value: "UNRESOLVED", label: "Open & in progress" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
] as const;

export default async function IssuesPage({ searchParams }: PageProps<"/admin/issues">) {
  await requireStaff("issue:resolve");
  const { view } = await searchParams;
  const status = VIEWS.find((v) => v.value === view)?.value ?? "UNRESOLVED";
  const [issues, settings] = await Promise.all([listIssues(status), getSettings()]);
  const fmt = dateTimeFormatter(settings.timezone);

  return (
    <>
      <PageHeader
        title="Computer issues"
        description="Problems students reported from their PCs. Reported PCs are flagged for maintenance until resolved."
        actions={<UrlSelect param="view" label="Show" value={status} options={[...VIEWS]} />}
      />
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Computer</TableHead>
              <TableHead>Problem</TableHead>
              <TableHead className="hidden md:table-cell">Reported</TableHead>
              <TableHead className="text-right">
                {status === "RESOLVED" ? "Resolved" : <span className="sr-only">Actions</span>}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground h-24 text-center">
                  {status === "RESOLVED" ? "Nothing resolved yet." : "No open issues. 🎉"}
                </TableCell>
              </TableRow>
            )}
            {issues.map((i) => {
              const pcLabel = `PC ${i.computer.number}`;
              return (
                <TableRow key={i.id}>
                  <TableCell>
                    <Link href={`/admin/labs/${i.computer.lab.id}`} className="font-medium hover:underline">
                      {i.computer.lab.name}, {pcLabel}
                    </Link>
                    <div className="mt-1 flex gap-1">
                      {i.status === "IN_PROGRESS" && <Badge variant="outline">In progress</Badge>}
                      {i.status === "OPEN" && <Badge variant="destructive">Open</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-80">
                    <div className="font-medium">{ISSUE_CATEGORY_LABELS[i.category]}</div>
                    <div className="text-muted-foreground text-sm">{i.description}</div>
                  </TableCell>
                  <TableCell className="hidden text-sm md:table-cell">
                    {fmt.format(i.createdAt)}
                    <div className="text-muted-foreground text-xs">
                      by {i.reporter.firstName} {i.reporter.lastName} ({i.reporter.idNumber})
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {i.status === "RESOLVED" ? (
                      <div className="text-sm">
                        {i.resolvedAt && fmt.format(i.resolvedAt)}
                        <div className="text-muted-foreground text-xs">
                          {i.resolvedBy && `by ${i.resolvedBy.firstName} ${i.resolvedBy.lastName}`}
                        </div>
                      </div>
                    ) : (
                      <IssueActions id={i.id} status={i.status} pcLabel={pcLabel} />
                    )}
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
