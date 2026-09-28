import "server-only";
import { db } from "@/lib/db";

/** Labs with a count of PCs per state and how many are in use right now. */
export async function listLabsWithStats() {
  const [labs, states, inUse, available] = await Promise.all([
    db.lab.findMany({ orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }] }),
    db.computer.groupBy({ by: ["labId", "state"], _count: true }),
    db.sitIn.groupBy({ by: ["labId"], where: { status: "ACTIVE" }, _count: true }),
    // Bookable right now: in service and nobody sitting at it.
    db.computer.groupBy({
      by: ["labId"],
      where: { state: "ACTIVE", sitIns: { none: { status: "ACTIVE" } } },
      _count: true,
    }),
  ]);
  return labs.map((lab) => {
    const count = (state: string) => states.find((s) => s.labId === lab.id && s.state === state)?._count ?? 0;
    const total = states.filter((s) => s.labId === lab.id).reduce((sum, s) => sum + s._count, 0);
    return {
      ...lab,
      total,
      locked: count("LOCKED"),
      maintenance: count("MAINTENANCE"),
      inUse: inUse.find((u) => u.labId === lab.id)?._count ?? 0,
      available: available.find((a) => a.labId === lab.id)?._count ?? 0,
    };
  });
}

export type LabWithStats = Awaited<ReturnType<typeof listLabsWithStats>>[number];

/** One lab with every PC and who (if anyone) is using it. */
export async function getLabWithComputers(id: string) {
  return db.lab.findUnique({
    where: { id },
    include: {
      computers: {
        orderBy: { number: "asc" },
        select: {
          id: true,
          number: true,
          state: true,
          note: true,
          sitIns: {
            where: { status: "ACTIVE" },
            select: { student: { select: { firstName: true, lastName: true, idNumber: true } } },
          },
        },
      },
    },
  });
}
