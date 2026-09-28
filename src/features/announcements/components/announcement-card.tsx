import { Pin } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import type { AnnouncementRow } from "../service";

/** One post. The body is plain text (rendered with preserved line breaks), never HTML. */
export function AnnouncementCard({
  a,
  dateFormat,
  status,
  actions,
}: {
  a: AnnouncementRow;
  dateFormat: Intl.DateTimeFormat;
  status?: ReactNode;
  actions?: ReactNode;
}) {
  const target = a.audience === "LAB" ? a.lab?.name : a.audience === "COURSE" ? a.course?.code : null;
  return (
    <article className="rounded-lg border p-4">
      <header className="flex items-start gap-2">
        {a.pinned && <Pin className="text-primary mt-1 size-4 shrink-0" aria-label="Pinned" />}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{a.title}</h3>
          <p className="text-muted-foreground text-xs">
            {dateFormat.format(a.publishAt)} · {a.author.firstName} {a.author.lastName}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          {target && <Badge variant="outline">{target}</Badge>}
          {status}
          {actions}
        </div>
      </header>
      <p className="mt-3 text-sm whitespace-pre-wrap">{a.body}</p>
    </article>
  );
}
