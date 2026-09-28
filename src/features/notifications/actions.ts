"use server";

import { z } from "zod";
import { createAction } from "@/lib/action";
import { db } from "@/lib/db";
import { recentNotifications, unreadCount } from "./queries";

const signedIn = { signedIn: true } as const;

/** For the bell: unread count plus the latest few. */
export const bellAction = createAction(z.object({}), signedIn, async (_input, { user }) => ({
  unread: await unreadCount(user.id),
  items: await recentNotifications(user.id),
}));

export const unreadCountAction = createAction(z.object({}), signedIn, (_input, { user }) => unreadCount(user.id));

// Scoped by userId, so nobody can mark someone else's notifications.
export const markReadAction = createAction(z.object({ id: z.string().min(1) }), signedIn, async ({ id }, { user }) => {
  await db.notification.updateMany({ where: { id, userId: user.id, readAt: null }, data: { readAt: new Date() } });
});

export const markAllReadAction = createAction(z.object({}), signedIn, async (_input, { user }) => {
  await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
});
