import "server-only";
import { db, type Tx } from "@/lib/db";
import { DomainError, NotFoundError } from "@/lib/errors";
import { uniqueViolation } from "@/lib/prisma-errors";
import { dateOnlyInTz } from "@/lib/time";
import { writeAudit } from "@/features/audit/service";
import { getSettings } from "@/features/settings/queries";
import { computersToRemove, planStateChange } from "./rules";
import type { ComputerState, CreateLabInput, UpdateLabInput } from "./schemas";

type Actor = { id: string; ip: string | null };

const LAB_UNIQUE = { code: "Another lab already uses that code." };

async function getLab(tx: Tx, id: string) {
  const lab = await tx.lab.findUnique({ where: { id } });
  if (!lab) throw new NotFoundError("Lab");
  return lab;
}

// ---------------------------------------------------------------------------
// Labs
// ---------------------------------------------------------------------------

export async function createLab({ computerCount, ...input }: CreateLabInput, actor: Actor) {
  try {
    return await db.$transaction(async (tx) => {
      const last = await tx.lab.aggregate({ _max: { sortOrder: true } });
      const lab = await tx.lab.create({ data: { ...input, sortOrder: (last._max.sortOrder ?? 0) + 1 } });
      await tx.computer.createMany({
        data: Array.from({ length: computerCount }, (_, i) => ({ labId: lab.id, number: i + 1 })),
      });
      await writeAudit(tx, {
        actorId: actor.id,
        action: "lab.create",
        entityType: "Lab",
        entityId: lab.id,
        details: { code: lab.code, computers: computerCount },
        ipAddress: actor.ip,
      });
      return lab;
    });
  } catch (e) {
    throw uniqueViolation(e, LAB_UNIQUE) ?? e;
  }
}

export async function updateLab({ id, ...input }: UpdateLabInput, actor: Actor) {
  try {
    return await db.$transaction(async (tx) => {
      const before = await getLab(tx, id);
      if (before.isActive && !input.isActive) {
        const active = await tx.sitIn.count({ where: { labId: id, status: "ACTIVE" } });
        if (active) throw new DomainError(`End the ${active} active sit-in(s) in this lab before deactivating it.`);
      }
      const after = await tx.lab.update({ where: { id }, data: input });
      await writeAudit(tx, {
        actorId: actor.id,
        action: "lab.update",
        entityType: "Lab",
        entityId: id,
        details: { before: pick(before), after: pick(after) },
        ipAddress: actor.ip,
      });
      return after;
    });
  } catch (e) {
    throw uniqueViolation(e, LAB_UNIQUE) ?? e;
  }
}

/**
 * Adds PCs numbered after the current highest, or removes the highest-numbered ones.
 * PCs with any history (sit-ins, bookings, issue reports) can't be removed: mark them
 * as under maintenance instead, so past records keep pointing at a real computer.
 */
export async function resizeLab(labId: string, computerCount: number, actor: Actor) {
  return db.$transaction(async (tx) => {
    const lab = await getLab(tx, labId);
    const computers = await tx.computer.findMany({
      where: { labId },
      select: { id: true, number: true, _count: { select: { sitIns: true, reservations: true, issues: true } } },
    });
    const current = computers.length;
    const highest = Math.max(0, ...computers.map((c) => c.number));

    if (computerCount > current) {
      await tx.computer.createMany({
        data: Array.from({ length: computerCount - current }, (_, i) => ({ labId, number: highest + i + 1 })),
      });
    } else if (computerCount < current) {
      const numbers = computersToRemove(
        computers.map((c) => c.number),
        computerCount,
      );
      const doomed = computers.filter((c) => numbers.includes(c.number));
      const withHistory = doomed.filter((c) => c._count.sitIns + c._count.reservations + c._count.issues > 0);
      if (withHistory.length) {
        throw new DomainError(
          `PC ${withHistory.map((c) => c.number).join(", ")} ${withHistory.length === 1 ? "has" : "have"} history and can't be removed. Mark ${withHistory.length === 1 ? "it" : "them"} as under maintenance instead.`,
        );
      }
      await tx.computer.deleteMany({ where: { id: { in: doomed.map((c) => c.id) } } });
    }

    await writeAudit(tx, {
      actorId: actor.id,
      action: "lab.resize",
      entityType: "Lab",
      entityId: labId,
      details: { code: lab.code, from: current, to: computerCount },
      ipAddress: actor.ip,
    });
  });
}

// ---------------------------------------------------------------------------
// Computers
// ---------------------------------------------------------------------------

/**
 * Sets the state of one or more PCs in a lab, skipping any the rules refuse (see
 * rules.ts). When a PC becomes unavailable, its upcoming bookings are cancelled — the
 * original system did the same when a reserved PC was locked.
 */
export async function setComputerState(
  labId: string,
  computerIds: string[],
  state: ComputerState,
  note: string | undefined,
  actor: Actor,
) {
  const settings = await getSettings();
  return db.$transaction(async (tx) => {
    const lab = await getLab(tx, labId);
    const computers = await tx.computer.findMany({
      where: { labId, id: { in: computerIds } },
      select: { id: true, number: true, state: true, sitIns: { where: { status: "ACTIVE" }, select: { id: true } } },
    });
    if (computers.length !== computerIds.length) throw new DomainError("Some of those computers aren't in this lab.");

    const plan = planStateChange(
      computers.map((c) => ({ id: c.id, number: c.number, state: c.state, inUse: c.sitIns.length > 0 })),
      state,
    );
    const ids = plan.apply.map((c) => c.id);
    let cancelledBookings = 0;

    if (ids.length) {
      await tx.computer.updateMany({
        where: { id: { in: ids } },
        data: { state, note: state === "ACTIVE" ? null : note || null },
      });

      if (state !== "ACTIVE") {
        const today = dateOnlyInTz(new Date(), settings.timezone);
        const cancelled = await tx.reservation.updateMany({
          where: { computerId: { in: ids }, date: { gte: today }, status: { in: ["PENDING", "APPROVED"] } },
          data: {
            status: "CANCELLED",
            decisionNote: `PC ${state === "LOCKED" ? "locked" : "under maintenance"}`,
            decidedById: actor.id,
            decidedAt: new Date(),
          },
        });
        cancelledBookings = cancelled.count;
      }

      await writeAudit(tx, {
        actorId: actor.id,
        action: `computer.${state === "ACTIVE" ? "unlock" : state === "LOCKED" ? "lock" : "maintenance"}`,
        entityType: "Lab",
        entityId: labId,
        details: { lab: lab.code, computers: plan.apply.map((c) => c.number), note: note ?? null, cancelledBookings },
        ipAddress: actor.ip,
      });
    }
    return { changed: ids.length, skipped: plan.skipped, cancelledBookings };
  });
}

/** "Unlock all" from the original system, plus its counterpart. */
export async function bulkLab(labId: string, mode: "unlockAll" | "lockAll", actor: Actor) {
  const computers = await db.computer.findMany({
    where: { labId, state: mode === "unlockAll" ? "LOCKED" : "ACTIVE" },
    select: { id: true },
  });
  if (computers.length === 0) return { changed: 0, skipped: [], cancelledBookings: 0 };
  // Unlock-all only touches LOCKED PCs: maintenance flags are deliberate and stay put.
  return setComputerState(
    labId,
    computers.map((c) => c.id),
    mode === "unlockAll" ? "ACTIVE" : "LOCKED",
    undefined,
    actor,
  );
}

function pick(lab: {
  code: string;
  name: string;
  gridColumns: number;
  opensAt: number | null;
  closesAt: number | null;
  isActive: boolean;
}) {
  const { code, name, gridColumns, opensAt, closesAt, isActive } = lab;
  return { code, name, gridColumns, opensAt, closesAt, isActive };
}
