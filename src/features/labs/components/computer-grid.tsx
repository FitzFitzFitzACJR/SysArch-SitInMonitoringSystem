"use client";

import { Lock, LockOpen, Wrench, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/confirm-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ComputerTile, LabLegend, LiveBadge, TileGrid, countByStatus } from "@/features/lab-map/components/lab-tiles";
import type { LabSnapshot } from "@/features/lab-map/types";
import { useLiveLab } from "@/features/lab-map/use-live-lab";
import { bulkLabAction, setComputerStateAction } from "../actions";
import type { ComputerState } from "../schemas";

/**
 * Staff view of a lab: the live map (updates pushed over SSE) plus multi-select controls
 * to lock, unlock or flag computers.
 */
export function ComputerGrid({ initial, canManage }: { initial: LabSnapshot; canManage: boolean }) {
  const { snapshot, connection } = useLiveLab(initial);
  const { labId, columns, computers } = snapshot;
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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <LabLegend counts={countByStatus(computers)} />
        <div className="flex items-center gap-3">
          <LiveBadge connection={connection} />
          {canManage && (
            <>
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
            </>
          )}
        </div>
      </div>

      <TileGrid columns={columns} label="Computers">
        {computers.map((pc) => (
          <ComputerTile
            key={pc.id}
            pc={pc}
            withPeople
            selected={selected.has(pc.id)}
            onToggle={canManage ? () => toggle(pc.id) : undefined}
          />
        ))}
      </TileGrid>

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
