"use client";

import { CalendarClock, Lock, Monitor, TriangleAlert, User, Wrench, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Connection } from "../use-live-lab";
import type { SnapshotComputer, TileStatus } from "../types";

// Colour is never the only signal: every status also has an icon and a text label.
export const TILES: Record<TileStatus, { label: string; Icon: LucideIcon; className: string }> = {
  available: {
    label: "Available",
    Icon: Monitor,
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
  },
  inUse: { label: "In use", Icon: User, className: "border-sky-500/50 bg-sky-500/15 text-sky-900 dark:text-sky-100" },
  reserved: {
    label: "Reserved now",
    Icon: CalendarClock,
    className: "border-violet-500/50 bg-violet-500/15 text-violet-900 dark:text-violet-100",
  },
  locked: {
    label: "Locked",
    Icon: Lock,
    className: "border-zinc-500/40 bg-zinc-500/15 text-zinc-700 dark:text-zinc-300",
  },
  maintenance: {
    label: "Maintenance",
    Icon: Wrench,
    className: "border-amber-500/50 bg-amber-500/15 text-amber-900 dark:text-amber-100",
  },
};

export function LabLegend({ counts }: { counts?: Partial<Record<TileStatus, number>> }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm" aria-label="Legend">
      {(Object.keys(TILES) as TileStatus[]).map((status) => {
        const { label, Icon, className } = TILES[status];
        return (
          <li key={status} className="flex items-center gap-1.5">
            <span className={cn("grid size-5 place-items-center rounded border", className)}>
              <Icon className="size-3" aria-hidden />
            </span>
            {label}
            {counts && <span className="text-muted-foreground tabular-nums">({counts[status] ?? 0})</span>}
          </li>
        );
      })}
    </ul>
  );
}

export function countByStatus(computers: SnapshotComputer[]) {
  const counts: Partial<Record<TileStatus, number>> = {};
  for (const pc of computers) counts[pc.status] = (counts[pc.status] ?? 0) + 1;
  return counts;
}

export function describeComputer(pc: SnapshotComputer, withPeople: boolean) {
  return [
    `PC ${pc.number}`,
    pc.user && withPeople ? `in use by ${pc.user.name}` : TILES[pc.status].label.toLowerCase(),
    pc.status === "inUse" && pc.state === "MAINTENANCE" ? "flagged for maintenance" : null,
    pc.openIssues ? `${pc.openIssues} open issue${pc.openIssues === 1 ? "" : "s"}` : null,
    pc.note,
  ]
    .filter(Boolean)
    .join(", ");
}

/** The room layout: `columns` tiles per row from sm up, 5 on phones. */
export function TileGrid({ columns, children, label }: { columns: number; children: ReactNode; label: string }) {
  return (
    <div
      className="grid grid-cols-5 gap-2 sm:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]"
      style={{ "--cols": columns } as React.CSSProperties}
      role="group"
      aria-label={label}
    >
      {children}
    </div>
  );
}

export function ComputerTile({
  pc,
  withPeople,
  selected,
  onToggle,
}: {
  pc: SnapshotComputer;
  withPeople: boolean;
  selected?: boolean;
  onToggle?: () => void;
}) {
  const { Icon, className } = TILES[pc.status];
  const label = describeComputer(pc, withPeople);
  const interactive = Boolean(onToggle);

  const tile = (
    <button
      type="button"
      disabled={!interactive}
      aria-pressed={interactive ? Boolean(selected) : undefined}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        "relative flex aspect-square flex-col items-center justify-center rounded-md border text-xs font-medium tabular-nums transition",
        className,
        interactive && "focus-visible:ring-ring hover:brightness-95 focus-visible:ring-2 focus-visible:outline-none",
        !interactive && "cursor-default",
        selected && "ring-primary ring-offset-background ring-2 ring-offset-2",
      )}
    >
      <Icon className="size-3.5 opacity-70" aria-hidden />
      {pc.number}
      {pc.status === "inUse" && pc.state === "MAINTENANCE" && (
        <Wrench className="absolute top-0.5 right-0.5 size-3 text-amber-600" aria-hidden />
      )}
      {withPeople && pc.openIssues > 0 && (
        <TriangleAlert className="absolute top-0.5 left-0.5 size-3 text-rose-600" aria-hidden />
      )}
    </button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{tile}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function LiveBadge({ connection }: { connection: Connection }) {
  return (
    <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs" role="status">
      <span
        className={cn("size-2 rounded-full", connection === "live" ? "animate-pulse bg-emerald-500" : "bg-amber-500")}
        aria-hidden
      />
      {connection === "live" ? "Live" : connection === "connecting" ? "Connecting…" : "Reconnecting…"}
    </span>
  );
}
