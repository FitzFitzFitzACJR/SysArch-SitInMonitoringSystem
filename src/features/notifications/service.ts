import "server-only";
import type { NotificationType } from "@/generated/prisma/enums";
import type { Tx } from "@/lib/db";

export type NewNotification = { type: NotificationType; title: string; body: string; link?: string };

/**
 * In-app notifications, written in the same transaction as the event that caused them.
 * (Email delivery and the bell UI are layered on top in the notifications phase.)
 */
export function notify(tx: Tx, userId: string, n: NewNotification) {
  return tx.notification.create({ data: { userId, ...n } });
}

export async function notifyStaff(tx: Tx, n: NewNotification) {
  const staff = await tx.user.findMany({
    where: { role: { in: ["LAB_STAFF", "SUPER_ADMIN"] }, status: "ACTIVE" },
    select: { id: true },
  });
  if (staff.length) await tx.notification.createMany({ data: staff.map((s) => ({ userId: s.id, ...n })) });
}
