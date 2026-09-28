import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/app-shell";
import { Stars } from "@/components/star-rating";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackForm } from "@/features/feedback/components/feedback-form";
import { FEEDBACK_CATEGORY_LABELS } from "@/features/feedback/schemas";
import { listMyFeedback } from "@/features/feedback/service";
import { getSettings } from "@/features/settings/queries";
import { db } from "@/lib/db";
import { dateFormatter } from "@/lib/format";
import { requireStudent } from "@/lib/session";

export const metadata: Metadata = { title: "Feedback" };

export default async function FeedbackPage() {
  const user = await requireStudent();
  const [labs, mine, lastSitIn, settings] = await Promise.all([
    db.lab.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    listMyFeedback(user.id),
    db.sitIn.findFirst({ where: { studentId: user.id }, orderBy: { startedAt: "desc" }, select: { labId: true } }),
    getSettings(),
  ]);
  const fmt = dateFormatter(settings.timezone);

  return (
    <>
      <PageHeader title="Feedback" description="Tell the lab staff what's working and what isn't." />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Send feedback</CardTitle>
            <CardDescription>Staff read every submission.</CardDescription>
          </CardHeader>
          <CardContent>
            <FeedbackForm labs={labs} defaultLabId={lastSitIn?.labId} />
          </CardContent>
        </Card>
        <Card className="content-start gap-3">
          <CardHeader>
            <CardTitle>Your recent feedback</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {mine.length === 0 && <p className="text-muted-foreground text-sm">Nothing sent yet.</p>}
            {mine.map((f) => (
              <div key={f.id} className="text-sm">
                <div className="flex items-center justify-between gap-2">
                  <Stars rating={f.rating} />
                  <span className="text-muted-foreground text-xs">{fmt.format(f.createdAt)}</span>
                </div>
                <div className="text-muted-foreground text-xs">
                  {f.lab.name} · {FEEDBACK_CATEGORY_LABELS[f.category]} · {f.readAt ? "Read by staff" : "Not read yet"}
                </div>
                <p className="mt-1 line-clamp-2">{f.comments}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
