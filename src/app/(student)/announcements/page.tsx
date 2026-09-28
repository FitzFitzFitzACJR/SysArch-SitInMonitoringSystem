import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/app-shell";
import { AnnouncementCard } from "@/features/announcements/components/announcement-card";
import { listAnnouncementsForStudent } from "@/features/announcements/service";
import { getSettings } from "@/features/settings/queries";
import { dateTimeFormatter } from "@/lib/format";
import { requireStudent } from "@/lib/session";

export const metadata: Metadata = { title: "Announcements" };

export default async function StudentAnnouncementsPage() {
  const user = await requireStudent();
  const [announcements, settings] = await Promise.all([listAnnouncementsForStudent(user.id, 50), getSettings()]);
  const fmt = dateTimeFormatter(settings.timezone);
  return (
    <>
      <PageHeader title="Announcements" description="News from the CCS lab staff." />
      <div className="grid gap-3">
        {announcements.length === 0 && <p className="text-muted-foreground text-sm">No announcements right now.</p>}
        {announcements.map((a) => (
          <AnnouncementCard key={a.id} a={a} dateFormat={fmt} />
        ))}
      </div>
    </>
  );
}
