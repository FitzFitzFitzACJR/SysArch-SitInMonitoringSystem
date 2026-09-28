import "server-only";
import { db, type Tx } from "@/lib/db";
import { DomainError, NotFoundError } from "@/lib/errors";
import { UNUSABLE_PASSWORD } from "@/lib/password";
import { uniqueViolation } from "@/lib/prisma-errors";
import { writeAudit } from "@/features/audit/service";
import { UNIQUE_MESSAGES, sendPasswordLink } from "@/features/auth/service";
import type { StaffInput } from "./schemas";

type Actor = { id: string; ip: string | null };
type StaffRole = "LAB_STAFF" | "SUPER_ADMIN";

// Two admins demoting each other at the same moment must not both succeed and leave
// nobody in charge; serializable isolation makes Postgres reject one of them.
const SERIALIZABLE = { isolationLevel: "Serializable" } as const;

async function getStaff(tx: Tx | typeof db, id: string) {
  const user = await tx.user.findFirst({ where: { id, role: { in: ["LAB_STAFF", "SUPER_ADMIN"] } } });
  if (!user) throw new NotFoundError("Staff account");
  return user;
}

/** The system must never be left without an active super admin. */
async function assertAnotherSuperAdmin(tx: Tx, excludingId: string) {
  const others = await tx.user.count({ where: { role: "SUPER_ADMIN", status: "ACTIVE", id: { not: excludingId } } });
  if (others === 0) throw new DomainError("There must always be at least one active super admin.");
}

export async function createStaff(input: StaffInput, actor: Actor) {
  let user;
  try {
    user = await db.$transaction(async (tx) => {
      const created = await tx.user.create({ data: { ...input, passwordHash: UNUSABLE_PASSWORD } });
      await writeAudit(tx, {
        actorId: actor.id,
        action: "staff.create",
        entityType: "User",
        entityId: created.id,
        details: { idNumber: created.idNumber, role: created.role },
        ipAddress: actor.ip,
      });
      return created;
    });
  } catch (e) {
    throw uniqueViolation(e, UNIQUE_MESSAGES) ?? e;
  }
  await sendPasswordLink(user, "invite");
  return user;
}

export async function setStaffRole(id: string, role: StaffRole, actor: Actor) {
  if (id === actor.id) throw new DomainError("You can't change your own role.");
  await db.$transaction(async (tx) => {
    const user = await getStaff(tx, id);
    if (user.role === role) return;
    if (user.role === "SUPER_ADMIN") await assertAnotherSuperAdmin(tx, id);
    // The role is re-read from the database on the user's next request (lib/auth.ts).
    await tx.user.update({ where: { id }, data: { role } });
    await writeAudit(tx, {
      actorId: actor.id,
      action: "staff.setRole",
      entityType: "User",
      entityId: id,
      details: { from: user.role, to: role },
      ipAddress: actor.ip,
    });
  }, SERIALIZABLE);
}

export async function setStaffStatus(id: string, status: "ACTIVE" | "INACTIVE", actor: Actor) {
  if (id === actor.id) throw new DomainError("You can't deactivate your own account.");
  await db.$transaction(async (tx) => {
    const user = await getStaff(tx, id);
    if (status === "INACTIVE" && user.role === "SUPER_ADMIN") await assertAnotherSuperAdmin(tx, id);
    await tx.user.update({ where: { id }, data: { status } });
    await writeAudit(tx, {
      actorId: actor.id,
      action: "staff.setStatus",
      entityType: "User",
      entityId: id,
      details: { from: user.status, to: status },
      ipAddress: actor.ip,
    });
  }, SERIALIZABLE);
}

export async function resendStaffInvite(id: string) {
  const user = await getStaff(db, id);
  if (user.status !== "ACTIVE") throw new DomainError("Reactivate this account first.");
  await sendPasswordLink(user, "invite");
}
