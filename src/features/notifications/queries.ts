import "server-only";
import { db } from "@/lib/db";

export const NOTIFICATIONS_PAGE_SIZE = 20;

const select = { id: true, type: true, title: true, body: true, link: true, readAt: true, createdAt: true } as const;

export function unreadCount(userId: string) {
  return db.notification.count({ where: { userId, readAt: null } });
}

export function recentNotifications(userId: string, take = 8) {
  return db.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take, select });
}

export async function listNotifications(userId: string, page: number) {
  const where = { userId };
  const [rows, total] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * NOTIFICATIONS_PAGE_SIZE,
      take: NOTIFICATIONS_PAGE_SIZE,
      select,
    }),
    db.notification.count({ where }),
  ]);
  return { rows, total, pageCount: Math.max(1, Math.ceil(total / NOTIFICATIONS_PAGE_SIZE)) };
}

export type NotificationItem = Awaited<ReturnType<typeof recentNotifications>>[number];
