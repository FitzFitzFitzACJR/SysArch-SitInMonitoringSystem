import "server-only";
import type { NotificationType } from "@/generated/prisma/enums";
import type { Tx } from "@/lib/db";

export type NewNotification = { type: NotificationType; title: string; body: string; link?: string };

// Which notifications are also emailed. One policy, in one place.
const EMAILED: ReadonlySet<NotificationType> = new Set(["RESERVATION"]);

/**
 * In-app notifications, written in the same transaction as the event that caused them.
 * Emailed types are flagged for the outbox (email-outbox.ts) and sent after commit.
 */
export function notify(tx: Tx, userId: string, n: NewNotification) {
  return tx.notification.create({ data: { userId, ...n, sendEmail: EMAILED.has(n.type) } });
}

/** Staff-facing alerts stay in-app only (they'd flood inboxes). */
export async function notifyStaff(tx: Tx, n: NewNotification) {
  const staff = await tx.user.findMany({
    where: { role: { in: ["LAB_STAFF", "SUPER_ADMIN"] }, status: "ACTIVE" },
    select: { id: true },
  });
  if (staff.length) await tx.notification.createMany({ data: staff.map((s) => ({ userId: s.id, ...n })) });
}
