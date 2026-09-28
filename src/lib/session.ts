import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Session } from "next-auth";
import { auth } from "./auth";
import { can, homePathFor, isStaff, type Permission } from "./permissions";

export type SessionUser = Session["user"];

// proxy.ts does coarse routing; these helpers are the real checks, run in every page and action.

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  return session?.user ?? null;
});

/** For pages: signed-in user who has finished any forced password change. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");
  return user;
}

export async function requireStudent(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "STUDENT") redirect(homePathFor(user.role));
  return user;
}

export async function requireStaff(permission?: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!isStaff(user.role)) redirect(homePathFor(user.role));
  if (permission && !can(user.role, permission)) redirect("/admin");
  return user;
}
