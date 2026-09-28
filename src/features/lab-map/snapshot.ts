import "server-only";
import { db } from "@/lib/db";
import { computersReservedNow } from "@/features/reservations/service";
import { snapshotStatus, type LabSnapshot } from "./types";

// Every viewer of a lab (staff grids, student maps) is served from one snapshot per
// server instance, rebuilt at most this often. So N open maps cost ~3 queries per
// interval, not 3×N.
const TTL_MS = 2_000;
const cache = new Map<string, { at: number; data: Promise<LabSnapshot | null> }>();

export function getLabSnapshot(labId: string): Promise<LabSnapshot | null> {
  const hit = cache.get(labId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  const data = buildSnapshot(labId);
  cache.set(labId, { at: Date.now(), data });
  data.catch(() => cache.delete(labId)); // don't cache failures
  return data;
}

async function buildSnapshot(labId: string): Promise<LabSnapshot | null> {
  const [lab, reserved] = await Promise.all([
    db.lab.findUnique({
      where: { id: labId },
      select: {
        id: true,
        name: true,
        gridColumns: true,
        isActive: true,
        computers: {
          orderBy: { number: "asc" },
          select: {
            id: true,
            number: true,
            state: true,
            note: true,
            sitIns: {
              where: { status: "ACTIVE" },
              select: { endsAt: true, student: { select: { firstName: true, lastName: true, idNumber: true } } },
            },
            _count: { select: { issues: { where: { status: { not: "RESOLVED" } } } } },
          },
        },
      },
    }),
    computersReservedNow(labId),
  ]);
  if (!lab) return null;

  return {
    labId: lab.id,
    name: lab.name,
    columns: lab.gridColumns,
    isActive: lab.isActive,
    generatedAt: new Date().toISOString(),
    computers: lab.computers.map((pc) => {
      const sitIn = pc.sitIns[0];
      const inUse = Boolean(sitIn);
      return {
        id: pc.id,
        number: pc.number,
        state: pc.state,
        status: snapshotStatus({ state: pc.state, inUse, reserved: reserved.has(pc.id) }),
        note: pc.note,
        openIssues: pc._count.issues,
        user: sitIn
          ? { name: `${sitIn.student.firstName} ${sitIn.student.lastName}`, idNumber: sitIn.student.idNumber }
          : null,
        endsAt: sitIn?.endsAt.toISOString() ?? null,
      };
    }),
  };
}

/** Students see availability only: no names, notes or issue counts. */
export function publicSnapshot(s: LabSnapshot): LabSnapshot {
  return {
    ...s,
    computers: s.computers.map((pc) => ({ ...pc, note: null, openIssues: 0, user: null, endsAt: null })),
  };
}
