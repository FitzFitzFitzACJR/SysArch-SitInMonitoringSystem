import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { dateOnlyInTz, hhmmToMinutes, localTimeToInstant } from "@/lib/time";
import { writeAudit } from "@/features/audit/service";
import { getSettings } from "@/features/settings/queries";
import type { AnnouncementInput } from "./schemas";

type Actor = { id: string; ip: string | null };

/** "2026-10-01T08:30" in the lab's timezone → real instant. */
function toInstant(local: string, timeZone: string) {
  const [date, time] = local.split("T");
  return localTimeToInstant(new Date(`${date}T00:00:00Z`), hhmmToMinutes(time), timeZone);
}

async function toData(input: AnnouncementInput) {
  const { timezone } = await getSettings();
  return {
    title: input.title,
    body: input.body,
    pinned: input.pinned,
    publishAt: input.publishAt ? toInstant(input.publishAt, timezone) : new Date(),
    expiresAt: input.expiresAt ? toInstant(input.expiresAt, timezone) : null,
    audience: input.audience,
    // Keep only the target that matches the audience.
    labId: input.audience === "LAB" ? input.labId : null,
    courseId: input.audience === "COURSE" ? input.courseId : null,
  };
}

export async function createAnnouncement(input: AnnouncementInput, actor: Actor) {
  const data = await toData(input);
  return db.$transaction(async (tx) => {
    const a = await tx.announcement.create({ data: { ...data, authorId: actor.id } });
    await writeAudit(tx, {
      actorId: actor.id,
      action: "announcement.create",
      entityType: "Announcement",
      entityId: a.id,
      details: { title: a.title, audience: a.audience },
      ipAddress: actor.ip,
    });
    return a;
  });
}

export async function updateAnnouncement(id: string, input: AnnouncementInput, actor: Actor) {
  const data = await toData(input);
  return db.$transaction(async (tx) => {
    const before = await tx.announcement.findFirst({ where: { id, archivedAt: null } });
    if (!before) throw new NotFoundError("Announcement");
    await tx.announcement.update({ where: { id }, data });
    await writeAudit(tx, {
      actorId: actor.id,
      action: "announcement.update",
      entityType: "Announcement",
      entityId: id,
      details: { title: data.title },
      ipAddress: actor.ip,
    });
  });
}

/** "Delete" archives: the post disappears for everyone but stays in the audit history. */
export async function archiveAnnouncement(id: string, actor: Actor) {
  return db.$transaction(async (tx) => {
    const a = await tx.announcement.findFirst({ where: { id, archivedAt: null } });
    if (!a) throw new NotFoundError("Announcement");
    await tx.announcement.update({ where: { id }, data: { archivedAt: new Date() } });
    await writeAudit(tx, {
      actorId: actor.id,
      action: "announcement.delete",
      entityType: "Announcement",
      entityId: id,
      details: { title: a.title },
      ipAddress: actor.ip,
    });
  });
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

const include = {
  author: { select: { firstName: true, lastName: true } },
  lab: { select: { name: true } },
  course: { select: { code: true } },
} as const;

export function listAnnouncementsForStaff() {
  return db.announcement.findMany({
    where: { archivedAt: null },
    orderBy: [{ pinned: "desc" }, { publishAt: "desc" }],
    take: 100,
    include,
  });
}

/**
 * What one student should see: published, not expired, and aimed at everyone, their
 * course, or a lab they're in or have booked in the coming week.
 */
export async function listAnnouncementsForStudent(studentId: string, take = 20) {
  const settings = await getSettings();
  const now = new Date();
  const today = dateOnlyInTz(now, settings.timezone);
  const student = await db.user.findUniqueOrThrow({ where: { id: studentId }, select: { courseId: true } });
  const [sitIns, bookings] = await Promise.all([
    db.sitIn.findMany({ where: { studentId, status: "ACTIVE" }, select: { labId: true } }),
    db.reservation.findMany({
      where: {
        studentId,
        status: { in: ["PENDING", "APPROVED"] },
        date: { gte: today, lte: new Date(today.getTime() + 7 * 86_400_000) },
      },
      select: { labId: true },
    }),
  ]);
  const labIds = [...new Set([...sitIns, ...bookings].map((x) => x.labId))];

  const audience: Prisma.AnnouncementWhereInput[] = [{ audience: "ALL" }];
  if (student.courseId) audience.push({ audience: "COURSE", courseId: student.courseId });
  if (labIds.length) audience.push({ audience: "LAB", labId: { in: labIds } });

  return db.announcement.findMany({
    where: {
      archivedAt: null,
      publishAt: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      AND: [{ OR: audience }],
    },
    orderBy: [{ pinned: "desc" }, { publishAt: "desc" }],
    take,
    include,
  });
}

export type AnnouncementRow = Awaited<ReturnType<typeof listAnnouncementsForStaff>>[number];
