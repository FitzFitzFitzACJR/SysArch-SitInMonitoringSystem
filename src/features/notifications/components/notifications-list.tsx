import Link from "next/link";
import { ListPagination } from "@/components/list-pagination";
import { Card } from "@/components/ui/card";
import { getSettings } from "@/features/settings/queries";
import { dateTimeFormatter } from "@/lib/format";
import { cn } from "@/lib/utils";
import { listNotifications } from "../queries";
import { MarkAllReadButton } from "./mark-all-read-button";
import { NotificationIcon } from "./notification-icon";

/** Full notification history; shared by the student and staff pages. */
export async function NotificationsList({
  userId,
  page,
  basePath,
}: {
  userId: string;
  page: number;
  basePath: string;
}) {
  const [{ rows, pageCount }, settings] = await Promise.all([listNotifications(userId, page), getSettings()]);
  const fmt = dateTimeFormatter(settings.timezone);

  return (
    <>
      <div className="mb-3 flex justify-end">
        <MarkAllReadButton />
      </div>
      <Card className="gap-0 py-0">
        {rows.length === 0 && <p className="text-muted-foreground p-8 text-center text-sm">No notifications yet.</p>}
        <ul className="divide-y">
          {rows.map((n) => {
            const content = (
              <div className="flex items-start gap-3 p-4">
                <NotificationIcon type={n.type} className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className={cn("text-sm", !n.readAt && "font-semibold")}>{n.title}</div>
                  <div className="text-muted-foreground text-sm">{n.body}</div>
                  <div className="text-muted-foreground mt-1 text-xs">{fmt.format(n.createdAt)}</div>
                </div>
                {!n.readAt && <span className="bg-primary mt-1.5 size-2 rounded-full" aria-label="Unread" />}
              </div>
            );
            return (
              <li key={n.id}>
                {n.link ? (
                  <Link href={n.link} className="hover:bg-muted/50 block">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      </Card>
      <ListPagination page={page} pageCount={pageCount} basePath={basePath} params={{}} />
    </>
  );
}
