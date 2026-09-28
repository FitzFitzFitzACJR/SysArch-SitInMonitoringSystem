import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/app-shell";
import { NotificationsList } from "@/features/notifications/components/notifications-list";
import { requireStudent } from "@/lib/session";

export const metadata: Metadata = { title: "Notifications" };

export default async function StudentNotificationsPage({ searchParams }: PageProps<"/notifications">) {
  const user = await requireStudent();
  const page = Math.max(1, Number((await searchParams).page) || 1);
  return (
    <>
      <PageHeader title="Notifications" />
      <NotificationsList userId={user.id} page={page} basePath="/notifications" />
    </>
  );
}
