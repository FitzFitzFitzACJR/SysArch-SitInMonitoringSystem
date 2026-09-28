import "server-only";
import { randomBytes } from "node:crypto";
import { db, type Tx } from "@/lib/db";
import { DomainError, NotFoundError } from "@/lib/errors";
import { processProfilePhoto } from "@/lib/images";
import { UNUSABLE_PASSWORD } from "@/lib/password";
import { uniqueViolation } from "@/lib/prisma-errors";
import { deleteFile, saveFile } from "@/lib/storage";
import { writeAudit } from "@/features/audit/service";
import { UNIQUE_MESSAGES, sendPasswordLink } from "@/features/auth/service";
import { adjustBalance } from "@/features/points/ledger";
import { getSessionAllotment } from "@/features/semesters/queries";
import { validateRows, type ImportRowResult, type RawRow } from "./import";
import type { ProfileInput, StudentInput, UpdateStudentInput } from "./schemas";

export type Actor = { id: string; ip: string | null };

async function assertCourse(tx: Tx, courseId: string) {
  const course = await tx.course.findFirst({ where: { id: courseId, isActive: true } });
  if (!course) throw new DomainError("Select a valid course.", { courseId: ["Select a valid course"] });
}

async function getStudent(tx: Tx, id: string) {
  const student = await tx.user.findFirst({ where: { id, role: "STUDENT" } });
  if (!student) throw new NotFoundError("Student");
  return student;
}

// ---------------------------------------------------------------------------
// Create / update
// ---------------------------------------------------------------------------

/** Staff-created accounts get the current allotment and an emailed "set your password" link. */
export async function createStudent(input: StudentInput, actor: Actor) {
  const allotment = await getSessionAllotment();
  let student;
  try {
    student = await db.$transaction(async (tx) => {
      await assertCourse(tx, input.courseId);
      const created = await tx.user.create({ data: { ...input, passwordHash: UNUSABLE_PASSWORD } });
      await adjustBalance(tx, {
        userId: created.id,
        sessionsDelta: allotment.sessions,
        reason: "SEMESTER_RESET",
        note: "Initial session allotment",
        actorId: actor.id,
        semesterId: allotment.semesterId,
      });
      await writeAudit(tx, {
        actorId: actor.id,
        action: "student.create",
        entityType: "User",
        entityId: created.id,
        details: { idNumber: created.idNumber },
        ipAddress: actor.ip,
      });
      return created;
    });
  } catch (e) {
    throw uniqueViolation(e, UNIQUE_MESSAGES) ?? e;
  }
  await sendPasswordLink(student, "invite");
  return student;
}

export async function updateStudent({ id, ...input }: UpdateStudentInput, actor: Actor) {
  try {
    return await db.$transaction(async (tx) => {
      const before = await getStudent(tx, id);
      await assertCourse(tx, input.courseId);
      const after = await tx.user.update({ where: { id }, data: input });
      await writeAudit(tx, {
        actorId: actor.id,
        action: "student.update",
        entityType: "User",
        entityId: id,
        details: { changed: changedFields(before, after, Object.keys(input)) },
        ipAddress: actor.ip,
      });
      return after;
    });
  } catch (e) {
    throw uniqueViolation(e, UNIQUE_MESSAGES) ?? e;
  }
}

/** A student editing their own profile. Not audit-logged: the audit log is for staff actions. */
export async function updateOwnProfile(userId: string, input: ProfileInput) {
  try {
    return await db.$transaction(async (tx) => {
      await assertCourse(tx, input.courseId);
      return tx.user.update({ where: { id: userId }, data: input });
    });
  } catch (e) {
    throw uniqueViolation(e, UNIQUE_MESSAGES) ?? e;
  }
}

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

export async function setPhoto(userId: string, file: File, actor?: Actor) {
  const image = await processProfilePhoto(file);
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { photoUrl: true } });

  // A new random key each time, so browsers and CDNs never show a cached old photo.
  const stored = await saveFile(`photos/${userId}-${randomBytes(6).toString("hex")}.webp`, image, "image/webp");
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { photoUrl: stored.url } });
    if (actor && actor.id !== userId) {
      await writeAudit(tx, {
        actorId: actor.id,
        action: "student.photo.update",
        entityType: "User",
        entityId: userId,
        ipAddress: actor.ip,
      });
    }
  });
  if (user.photoUrl) await deleteFile(user.photoUrl);
  return stored.url;
}

export async function removePhoto(userId: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { photoUrl: true } });
  if (!user.photoUrl) return;
  await db.user.update({ where: { id: userId }, data: { photoUrl: null } });
  await deleteFile(user.photoUrl);
}

// ---------------------------------------------------------------------------
// Sessions, status, deletion
// ---------------------------------------------------------------------------

/** Puts one student back to the current allotment (e.g. after a mistake), via the ledger. */
export async function resetStudentSessions(id: string, actor: Actor) {
  const allotment = await getSessionAllotment();
  return db.$transaction(async (tx) => {
    const student = await getStudent(tx, id);
    const delta = allotment.sessions - student.remainingSessions;
    if (delta !== 0) {
      await adjustBalance(tx, {
        userId: id,
        sessionsDelta: delta,
        reason: "MANUAL_SESSIONS",
        note: `Reset to ${allotment.sessions} sessions`,
        actorId: actor.id,
        semesterId: allotment.semesterId,
      });
    }
    await writeAudit(tx, {
      actorId: actor.id,
      action: "student.resetSessions",
      entityType: "User",
      entityId: id,
      details: { from: student.remainingSessions, to: allotment.sessions },
      ipAddress: actor.ip,
    });
    return allotment.sessions;
  });
}

/**
 * ACTIVE ↔ INACTIVE (can't sign in, kept in lists) ↔ ARCHIVED (hidden from lists; history kept).
 * Sessions of a deactivated user are revoked on their next request (see lib/auth.ts).
 */
export async function setStudentStatus(id: string, status: "ACTIVE" | "INACTIVE" | "ARCHIVED", actor: Actor) {
  return db.$transaction(async (tx) => {
    const student = await getStudent(tx, id);
    if (status !== "ACTIVE") {
      const active = await tx.sitIn.count({ where: { studentId: id, status: "ACTIVE" } });
      if (active) throw new DomainError("End this student's active sit-in first.");
    }
    await tx.user.update({ where: { id }, data: { status } });
    // Open bookings can't be honoured for someone who can no longer sign in.
    if (status !== "ACTIVE") {
      await tx.reservation.updateMany({
        where: { studentId: id, status: { in: ["PENDING", "APPROVED"] } },
        data: {
          status: "CANCELLED",
          decisionNote: "Account deactivated",
          decidedById: actor.id,
          decidedAt: new Date(),
        },
      });
    }
    await writeAudit(tx, {
      actorId: actor.id,
      action: "student.setStatus",
      entityType: "User",
      entityId: id,
      details: { from: student.status, to: status },
      ipAddress: actor.ip,
    });
  });
}

/**
 * Permanent deletion is only for accounts created by mistake. Anyone with lab history is
 * archived instead, so reports and past semesters stay accurate.
 */
export async function deleteStudent(id: string, actor: Actor) {
  const student = await db.$transaction(async (tx) => {
    const s = await getStudent(tx, id);
    const [sitIns, reservations, feedback, issues] = await Promise.all([
      tx.sitIn.count({ where: { studentId: id } }),
      tx.reservation.count({ where: { studentId: id } }),
      tx.feedback.count({ where: { studentId: id } }),
      tx.computerIssue.count({ where: { reporterId: id } }),
    ]);
    if (sitIns + reservations + feedback + issues > 0) {
      throw new DomainError("This student has lab history, so they can only be archived, not deleted.");
    }
    await tx.pointsLog.deleteMany({ where: { userId: id } });
    await tx.user.delete({ where: { id } });
    await writeAudit(tx, {
      actorId: actor.id,
      action: "student.delete",
      entityType: "User",
      entityId: id,
      details: { idNumber: s.idNumber, name: `${s.firstName} ${s.lastName}` },
      ipAddress: actor.ip,
    });
    return s;
  });
  if (student.photoUrl) await deleteFile(student.photoUrl);
}

// ---------------------------------------------------------------------------
// Bulk import
// ---------------------------------------------------------------------------

export async function buildImportPreview(rows: RawRow[]): Promise<ImportRowResult[]> {
  const [courses, users] = await Promise.all([
    db.course.findMany({ where: { isActive: true }, select: { id: true, code: true } }),
    db.user.findMany({ select: { idNumber: true, email: true } }),
  ]);
  return validateRows(rows, {
    courseIdsByCode: new Map(courses.map((c) => [c.code.toUpperCase(), c.id])),
    existingIdNumbers: new Set(users.map((u) => u.idNumber.toLowerCase())),
    existingEmails: new Set(users.map((u) => u.email.toLowerCase())),
  });
}

/**
 * Re-validates against the database at commit time (the preview may be stale) and imports
 * every valid row in one transaction. Invalid rows are skipped and reported back.
 */
export async function importStudents(rows: RawRow[], sendInvites: boolean, actor: Actor) {
  const results = await buildImportPreview(rows);
  const valid = results.filter((r) => r.data);
  if (valid.length === 0) throw new DomainError("There are no valid rows to import.");

  const allotment = await getSessionAllotment();
  const created = await db.$transaction(
    async (tx) => {
      const users = [];
      for (const { data } of valid) {
        // `course` is the code from the sheet; the row already carries the resolved courseId.
        const { course, courseId, ...fields } = data!;
        void course;
        const user = await tx.user.create({
          data: {
            ...fields,
            courseId,
            passwordHash: UNUSABLE_PASSWORD,
            remainingSessions: allotment.sessions,
            // Inline ledger row: same effect as adjustBalance, one query instead of two per student.
            pointsLog: {
              create: {
                sessionsDelta: allotment.sessions,
                reason: "SEMESTER_RESET",
                note: "Initial session allotment (import)",
                actorId: actor.id,
                semesterId: allotment.semesterId,
              },
            },
          },
          select: { id: true, email: true, firstName: true, idNumber: true },
        });
        users.push(user);
      }
      await writeAudit(tx, {
        actorId: actor.id,
        action: "student.import",
        entityType: "User",
        details: { imported: users.length, skipped: results.length - valid.length },
        ipAddress: actor.ip,
      });
      return users;
    },
    { timeout: 60_000 },
  );

  if (sendInvites) {
    for (const user of created) await sendPasswordLink(user, "invite");
  }
  return { imported: created.length, skipped: results.filter((r) => !r.data) };
}

function changedFields(before: Record<string, unknown>, after: Record<string, unknown>, keys: string[]) {
  const changes: Record<string, { from: string | number | null; to: string | number | null }> = {};
  for (const key of keys) {
    if (before[key] !== after[key]) {
      changes[key] = { from: before[key] as string | number | null, to: after[key] as string | number | null };
    }
  }
  return changes;
}
