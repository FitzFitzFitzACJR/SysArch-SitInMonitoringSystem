import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { DomainError, NotFoundError } from "@/lib/errors";
import { writeAudit } from "@/features/audit/service";
import { notifyStaff } from "@/features/notifications/service";
import { FEEDBACK_CATEGORY_LABELS, type FeedbackInput } from "./schemas";

type Actor = { id: string; ip: string | null };

const MAX_PER_DAY = 5;
const LOW_RATING = 2;

export async function submitFeedback(studentId: string, input: FeedbackInput) {
  return db.$transaction(async (tx) => {
    const recent = await tx.feedback.count({
      where: { studentId, createdAt: { gte: new Date(Date.now() - 86_400_000) } },
    });
    if (recent >= MAX_PER_DAY) throw new DomainError("You've sent a lot of feedback today. Please try again tomorrow.");

    const lab = await tx.lab.findUnique({ where: { id: input.labId } });
    if (!lab) throw new DomainError("Select a valid lab.");

    // Tie it to their latest sit-in in that lab this week, when there is one, for context.
    const sitIn = await tx.sitIn.findFirst({
      where: { studentId, labId: lab.id, startedAt: { gte: new Date(Date.now() - 7 * 86_400_000) } },
      orderBy: { startedAt: "desc" },
      select: { id: true },
    });

    const feedback = await tx.feedback.create({ data: { ...input, studentId, sitInId: sitIn?.id ?? null } });

    // Low ratings are worth a heads-up; the rest wait in the inbox.
    if (input.rating <= LOW_RATING) {
      await notifyStaff(tx, {
        type: "SYSTEM",
        title: `${input.rating}★ feedback for ${lab.name}`,
        body: `${FEEDBACK_CATEGORY_LABELS[input.category]}: ${input.comments.slice(0, 140)}`,
        link: "/admin/feedback",
      });
    }
    return feedback;
  });
}

export async function setFeedbackRead(id: string, read: boolean) {
  const { count } = await db.feedback.updateMany({ where: { id }, data: { readAt: read ? new Date() : null } });
  if (!count) throw new NotFoundError("Feedback");
}

export async function deleteFeedback(id: string, actor: Actor) {
  return db.$transaction(async (tx) => {
    const f = await tx.feedback.findUnique({ where: { id }, include: { lab: { select: { code: true } } } });
    if (!f) throw new NotFoundError("Feedback");
    await tx.feedback.delete({ where: { id } });
    await writeAudit(tx, {
      actorId: actor.id,
      action: "feedback.delete",
      entityType: "Feedback",
      entityId: id,
      details: { lab: f.lab.code, rating: f.rating },
      ipAddress: actor.ip,
    });
  });
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

export const FEEDBACK_PAGE_SIZE = 20;

export async function listFeedback(filter: { unreadOnly: boolean; labId?: string; page: number }) {
  const where: Prisma.FeedbackWhereInput = {
    ...(filter.unreadOnly && { readAt: null }),
    ...(filter.labId && { labId: filter.labId }),
  };
  const [rows, total] = await Promise.all([
    db.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filter.page - 1) * FEEDBACK_PAGE_SIZE,
      take: FEEDBACK_PAGE_SIZE,
      include: {
        lab: { select: { name: true } },
        student: { select: { id: true, firstName: true, lastName: true, idNumber: true } },
      },
    }),
    db.feedback.count({ where }),
  ]);
  return { rows, total, pageCount: Math.max(1, Math.ceil(total / FEEDBACK_PAGE_SIZE)) };
}

/** Average rating and volume per lab, for the summary strip. */
export async function feedbackSummary() {
  const [byLab, labs, unread] = await Promise.all([
    db.feedback.groupBy({ by: ["labId"], _avg: { rating: true }, _count: true }),
    db.lab.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.feedback.count({ where: { readAt: null } }),
  ]);
  return {
    unread,
    labs: labs
      .map((l) => {
        const g = byLab.find((b) => b.labId === l.id);
        return { id: l.id, name: l.name, count: g?._count ?? 0, average: g?._avg.rating ?? null };
      })
      .filter((l) => l.count > 0),
  };
}

export function listMyFeedback(studentId: string) {
  return db.feedback.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { lab: { select: { name: true } } },
  });
}
