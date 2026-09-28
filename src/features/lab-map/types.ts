// Shared by the server snapshot, the SSE stream and the client grids.

export type ComputerState = "ACTIVE" | "LOCKED" | "MAINTENANCE";
export type TileStatus = "available" | "inUse" | "reserved" | "locked" | "maintenance";

export type SnapshotComputer = {
  id: string;
  number: number;
  state: ComputerState;
  status: TileStatus;
  note: string | null;
  openIssues: number;
  user: { name: string; idNumber: string } | null;
  endsAt: string | null;
};

export type LabSnapshot = {
  labId: string;
  name: string;
  columns: number;
  isActive: boolean;
  generatedAt: string;
  computers: SnapshotComputer[];
};

/**
 * What a tile shows, in priority order. Someone sitting there wins (a PC can be in use
 * *and* flagged for maintenance, e.g. after the student reported a problem), then staff
 * states, then a booking for the current slot.
 */
export function snapshotStatus(pc: { state: ComputerState; inUse: boolean; reserved: boolean }): TileStatus {
  if (pc.inUse) return "inUse";
  if (pc.state === "LOCKED") return "locked";
  if (pc.state === "MAINTENANCE") return "maintenance";
  if (pc.reserved) return "reserved";
  return "available";
}
