"use client";

import type { LabSnapshot } from "../types";
import { useLiveLab } from "../use-live-lab";
import { ComputerTile, LabLegend, LiveBadge, TileGrid, countByStatus } from "./lab-tiles";

/** Read-only, anonymous availability map for students (the stream strips names server-side). */
export function StudentLabMap({ initial }: { initial: LabSnapshot }) {
  const { snapshot, connection } = useLiveLab(initial);
  const counts = countByStatus(snapshot.computers);
  const available = counts.available ?? 0;

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-lg font-medium" aria-live="polite">
          {snapshot.isActive ? (
            <>
              <span className="tabular-nums">{available}</span> of {snapshot.computers.length} computers free right now
            </>
          ) : (
            "This lab is closed for now."
          )}
        </p>
        <LiveBadge connection={connection} />
      </div>
      <LabLegend counts={counts} />
      <TileGrid columns={snapshot.columns} label={`${snapshot.name} computers`}>
        {snapshot.computers.map((pc) => (
          <ComputerTile key={pc.id} pc={pc} withPeople={false} />
        ))}
      </TileGrid>
    </div>
  );
}
