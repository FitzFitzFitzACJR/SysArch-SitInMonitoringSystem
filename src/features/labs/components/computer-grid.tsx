"use client";

import { Lock, LockOpen, Monitor, User, Wrench, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/confirm-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { bulkLabAction, setComputerStateAction } from "../actions";
import type { ComputerState } from "../schemas";

export type GridComputer = {
  id: string;
  number: number;
  state: ComputerState;
  note: string | null;
  user: { name: string; idNumber: string } | null;
};

// What a tile shows. "In use" wins over the state for display, but a PC can be both in use
// and flagged for maintenance (see rules.ts), in which case both are shown.
export const TILE_STYLES = {
  available: "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
  inUse: "border-sky-500/50 bg-sky-500/15 text-sky-900 dark:text-sky-100",
  locked: "border-zinc-500/40 bg-zinc-500/15 text-zinc-700 dark:text-zinc-300",
  maintenance: "border-amber-500/50 bg-amber-500/15 text-amber-900 dark:text-amber-100",
} as const;

export function tileKind(pc: Pick<GridComputer, "state" | "user">): keyof typeof TILE_STYLES {
  if (pc.user) return "inUse";
  if (pc.state === "LOCKED") return "locked";
  if (pc.state === "MAINTENANCE") return "maintenance";
  return "available";
}

export function ComputerLegend() {
  const items = [
    { kind: "available", label: "Available", Icon: Monitor },
    { kind: "inUse", label: "In use", Icon: User },
    { kind: "locked", label: "Locked", Icon: Lock },
    { kind: "maintenance", label: "Maintenance", Icon: Wrench },
  ] as const;
  return (
    <ul className="flex flex-wrap gap-3 text-sm" aria-label="Legend">
      {items.map(({ kind, label, Icon }) => (
        <li key={kind} className="flex items-center gap-1.5">
          <span className={cn("grid size-5 place-items-center rounded border", TILE_STYLES[kind])}>
            <Icon className="size-3" aria-hidden />
          </span>
          {label}
        </li>
      ))}
    </ul>
  );
}

export function ComputerGrid({
  labId,
  columns,
  computers,
  canManage,
}: {
  labId: string;
  columns: number;
  computers: GridComputer[];
  canManage: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  function apply(state: ComputerState) {
    startTransition(async () => {
      const result = await setComputerStateAction({
        labId,
        computerIds: [...selected],
        state,
        note: note || undefined,
      });
      if (!result.ok) return void toast.error(result.error);
      const { changed, skipped, cancelledBookings } = result.data;
      const parts = [`${changed} computer(s) updated`];
      if (skipped.length) parts.push(`skipped PC ${skipped.map((s) => s.number).join(", ")} (in use)`);
      if (cancelledBookings) parts.push(`${cancelledBookings} booking(s) cancelled`);
      toast[skipped.length ? "warning" : "success"](parts.join(" · "));
      setSelected(new Set());
      setNote("");
    });
  }

  const lockedCount = computers.filter((c) => c.state === "LOCKED").length;

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ComputerLegend />
        {canManage && (
          <div className="flex gap-2">
            <ConfirmAction
              trigger={
                <Button variant="outline" size="sm" disabled={lockedCount === 0}>
                  <LockOpen /> Unlock all
                </Button>
              }
              title="Unlock every locked computer?"
              description={`${lockedCount} locked PC(s) become available. Computers under maintenance stay flagged.`}
              confirmLabel="Unlock all"
              successMessage="Computers unlocked"
              action={() => bulkLabAction({ labId, mode: "unlockAll" })}
            />
            <ConfirmAction
              trigger={
                <Button variant="outline" size="sm">
                  <Lock /> Lock all
                </Button>
              }
              title="Lock every available computer?"
              description="Computers in use are left alone. Upcoming bookings on the locked PCs are cancelled."
              confirmLabel="Lock all"
              destructive
              successMessage="Computers locked"
              action={() => bulkLabAction({ labId, mode: "lockAll" })}
            />
          </div>
        )}
      </div>

      {/* Fewer columns on phones; the configured layout from sm up. */}
      <div
        className="grid grid-cols-5 gap-2 sm:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]"
        style={{ "--cols": columns } as React.CSSProperties}
        role={canManage ? "group" : undefined}
        aria-label="Computers"
      >
        {computers.map((pc) => {
          const kind = tileKind(pc);
          const isSelected = selected.has(pc.id);
          const label = [
            `PC ${pc.number}`,
            pc.user ? `in use by ${pc.user.name}` : kind,
            pc.state === "MAINTENANCE" && pc.user ? "flagged for maintenance" : null,
            pc.note,
          ]
            .filter(Boolean)
            .join(", ");
          const Icon = kind === "inUse" ? User : kind === "locked" ? Lock : kind === "maintenance" ? Wrench : Monitor;

          const tile = (
            <button
              type="button"
              disabled={!canManage}
              aria-pressed={canManage ? isSelected : undefined}
              aria-label={label}
              onClick={() => toggle(pc.id)}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-md border text-xs font-medium tabular-nums transition",
                TILE_STYLES[kind],
                canManage &&
                  "focus-visible:ring-ring hover:brightness-95 focus-visible:ring-2 focus-visible:outline-none",
                isSelected && "ring-primary ring-offset-background ring-2 ring-offset-2",
              )}
            >
              <Icon className="size-3.5 opacity-70" aria-hidden />
              {pc.number}
              {pc.state === "MAINTENANCE" && pc.user && (
                <Wrench className="absolute top-0.5 right-0.5 size-3 text-amber-600" aria-hidden />
              )}
            </button>
          );

          return (
            <Tooltip key={pc.id}>
              <TooltipTrigger asChild>{tile}</TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {canManage && selected.size > 0 && (
        <div className="bg-background/95 sticky bottom-3 z-10 flex flex-col gap-2 rounded-lg border p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setSelected(new Set())}
              aria-label="Clear selection"
            >
              <X />
            </Button>
            {selected.size} selected
          </div>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional), e.g. broken keyboard"
            className="sm:max-w-xs"
            maxLength={200}
            aria-label="Note"
          />
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <Button size="sm" variant="outline" disabled={pending} onClick={() => apply("ACTIVE")}>
              <LockOpen /> Available
            </Button>
            <Button size="sm" variant="outline" disabled={pending} onClick={() => apply("LOCKED")}>
              <Lock /> Lock
            </Button>
            <Button size="sm" variant="outline" disabled={pending} onClick={() => apply("MAINTENANCE")}>
              <Wrench /> Maintenance
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
