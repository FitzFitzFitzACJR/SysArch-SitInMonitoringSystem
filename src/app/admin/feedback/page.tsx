import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/app-shell";
import { ListPagination } from "@/components/list-pagination";
import { Stars } from "@/components/star-rating";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UrlSelect } from "@/components/url-select";
import { FeedbackRowActions } from "@/features/feedback/components/feedback-row-actions";
import { FEEDBACK_CATEGORY_LABELS } from "@/features/feedback/schemas";
import { feedbackSummary, listFeedback } from "@/features/feedback/service";
import { getSettings } from "@/features/settings/queries";
import { db } from "@/lib/db";
import { dateTimeFormatter } from "@/lib/format";
import { requireStaff } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Feedback" };

export default async function AdminFeedbackPage({ searchParams }: PageProps<"/admin/feedback">) {
  await requireStaff("feedback:read");
  const params = await searchParams;
  const unreadOnly = params.show !== "all";
  const labs = await db.lab.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  const labId = typeof params.lab === "string" && labs.some((l) => l.id === params.lab) ? params.lab : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const [{ rows, total, pageCount }, summary, settings] = await Promise.all([
    listFeedback({ unreadOnly, labId, page }),
    feedbackSummary(),
    getSettings(),
  ]);
  const fmt = dateTimeFormatter(settings.timezone);

  return (
    <>
      <PageHeader
        title="Feedback"
        description={`${summary.unread} unread`}
        actions={
          <div className="flex flex-col gap-2 sm:flex-row">
            <UrlSelect
              param="show"
              label="Show"
              value={unreadOnly ? "unread" : "all"}
              options={[
                { value: "unread", label: "Unread only" },
                { value: "all", label: "All feedback" },
              ]}
            />
            <UrlSelect
              param="lab"
              label="Lab"
              value={labId ?? "any"}
              options={[{ value: "any", label: "All labs" }, ...labs.map((l) => ({ value: l.id, label: l.name }))]}
            />
          </div>
        }
      />

      {summary.labs.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {summary.labs.map((l) => (
            <Card key={l.id} className="gap-1 py-4">
              <CardHeader className="px-4">
                <CardDescription>{l.name}</CardDescription>
                <CardTitle className="flex items-center gap-2 text-2xl tabular-nums">
                  {l.average?.toFixed(1)} <Stars rating={Math.round(l.average ?? 0)} />
                </CardTitle>
                <CardDescription className="text-xs">{l.count} response(s)</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-3">
        {rows.length === 0 && (
          <p className="text-muted-foreground text-sm">{unreadOnly ? "You're all caught up." : "No feedback yet."}</p>
        )}
        {rows.map((f) => (
          <article key={f.id} className={cn("rounded-lg border p-4", !f.readAt && "border-primary/40 bg-primary/5")}>
            <header className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Stars rating={f.rating} />
                  <Badge variant="outline">{FEEDBACK_CATEGORY_LABELS[f.category]}</Badge>
                  <span className="text-sm font-medium">{f.lab.name}</span>
                  {!f.readAt && <Badge>New</Badge>}
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {fmt.format(f.createdAt)} ·{" "}
                  <Link href={`/admin/students/${f.student.id}`} className="hover:underline">
                    {f.student.firstName} {f.student.lastName} ({f.student.idNumber})
                  </Link>
                </p>
              </div>
              <FeedbackRowActions id={f.id} read={Boolean(f.readAt)} />
            </header>
            <p className="mt-3 text-sm whitespace-pre-wrap">{f.comments}</p>
            {f.suggestions && (
              <p className="text-muted-foreground mt-2 text-sm whitespace-pre-wrap">
                <span className="font-medium">Suggestion:</span> {f.suggestions}
              </p>
            )}
          </article>
        ))}
      </div>
      <ListPagination
        page={page}
        pageCount={pageCount}
        basePath="/admin/feedback"
        params={{ show: unreadOnly ? undefined : "all", lab: labId }}
      />
      <p className="text-muted-foreground mt-2 text-xs">{total} matching</p>
    </>
  );
}
