import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { AnnouncementCard } from "@/features/announcements/components/announcement-card";
import { AnnouncementDialog } from "@/features/announcements/components/announcement-dialog";
import { DeleteAnnouncementButton } from "@/features/announcements/components/delete-announcement-button";
import { listAnnouncementsForStaff } from "@/features/announcements/service";
import { getSettings } from "@/features/settings/queries";
import { db } from "@/lib/db";
import { dateTimeFormatter, toLocalInputValue } from "@/lib/format";
import { requireStaff } from "@/lib/session";

export const metadata: Metadata = { title: "Announcements" };

export default async function AdminAnnouncementsPage() {
  await requireStaff("announcement:manage");
  const [announcements, settings, labs, courses] = await Promise.all([
    listAnnouncementsForStaff(),
    getSettings(),
    db.lab.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.course.findMany({ where: { isActive: true }, orderBy: { code: "asc" }, select: { id: true, name: true } }),
  ]);
  const fmt = dateTimeFormatter(settings.timezone);
  const now = new Date();

  return (
    <>
      <PageHeader
        title="Announcements"
        description="Posts shown on students' dashboards."
        actions={<AnnouncementDialog labs={labs} courses={courses} />}
      />
      <div className="grid gap-3">
        {announcements.length === 0 && <p className="text-muted-foreground text-sm">Nothing posted yet.</p>}
        {announcements.map((a) => {
          const scheduled = a.publishAt > now;
          const expired = a.expiresAt && a.expiresAt <= now;
          return (
            <AnnouncementCard
              key={a.id}
              a={a}
              dateFormat={fmt}
              status={
                scheduled ? (
                  <Badge variant="outline">Scheduled</Badge>
                ) : expired ? (
                  <Badge variant="secondary">Expired</Badge>
                ) : (
                  <Badge>Live</Badge>
                )
              }
              actions={
                <>
                  <AnnouncementDialog
                    labs={labs}
                    courses={courses}
                    announcement={{
                      id: a.id,
                      title: a.title,
                      body: a.body,
                      pinned: a.pinned,
                      publishAt: toLocalInputValue(a.publishAt, settings.timezone),
                      expiresAt: a.expiresAt ? toLocalInputValue(a.expiresAt, settings.timezone) : "",
                      audience: a.audience,
                      labId: a.labId ?? "",
                      courseId: a.courseId ?? "",
                    }}
                  />
                  <DeleteAnnouncementButton id={a.id} title={a.title} />
                </>
              }
            />
          );
        })}
      </div>
    </>
  );
}
