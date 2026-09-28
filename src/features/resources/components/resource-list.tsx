import { ExternalLink, FileDown } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

type Resource = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  fileName: string | null;
  isActive: boolean;
};

export function ResourceList({
  resources,
  actions,
  showStatus,
}: {
  resources: Resource[];
  actions?: (r: Resource) => ReactNode;
  showStatus?: boolean;
}) {
  if (resources.length === 0) return <p className="text-muted-foreground text-sm">No resources yet.</p>;
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {resources.map((r) => (
        <li key={r.id} className="flex items-start gap-3 rounded-lg border p-4">
          {r.fileName ? (
            <FileDown className="text-muted-foreground mt-0.5 size-5 shrink-0" aria-hidden />
          ) : (
            <ExternalLink className="text-muted-foreground mt-0.5 size-5 shrink-0" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            {r.url && (
              <a
                href={r.url}
                // Files are downloads; links open in a new tab without giving it access to this page.
                {...(r.fileName ? { download: r.fileName } : { target: "_blank", rel: "noopener noreferrer" })}
                className="font-medium hover:underline"
              >
                {r.title}
              </a>
            )}
            {r.description && <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">{r.description}</p>}
            <p className="text-muted-foreground mt-1 truncate text-xs">{r.fileName ?? r.url}</p>
            {showStatus && !r.isActive && (
              <Badge variant="outline" className="mt-2">
                Hidden from students
              </Badge>
            )}
          </div>
          {actions?.(r)}
        </li>
      ))}
    </ul>
  );
}
