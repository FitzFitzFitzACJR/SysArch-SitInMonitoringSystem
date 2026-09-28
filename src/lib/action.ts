import "server-only";
import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import type { z } from "zod";
import type { Role } from "@/generated/prisma/enums";
import { DomainError, ForbiddenError } from "./errors";
import { can, type Permission } from "./permissions";
import { clientIp } from "./request";
import { getCurrentUser, type SessionUser } from "./session";

import type { ActionResult } from "./action-result";

export type { ActionResult };

type Access =
  | { public: true }
  | { permission: Permission }
  | { roles: readonly Role[] }
  | { signedIn: true; allowPendingPasswordChange?: boolean };

type Ctx<A extends Access> = A extends { public: true }
  ? { user: SessionUser | null; ip: string }
  : { user: SessionUser; ip: string };

/**
 * Every server action goes through here, in this order:
 *   1. authenticate + authorize (server-side, regardless of what the UI shows)
 *   2. validate input with the same Zod schema the form uses
 *   3. run the handler (which calls a feature service)
 *   4. map DomainErrors to a friendly result; log anything unexpected
 *
 * CSRF: Next.js only accepts server actions as same-origin POSTs (Origin must match Host),
 * and the session cookie is SameSite=Lax.
 */
export function createAction<S extends z.ZodType, A extends Access, R>(
  schema: S,
  access: A,
  handler: (input: z.infer<S>, ctx: Ctx<A>) => Promise<R>,
) {
  return async (raw: unknown): Promise<ActionResult<R>> => {
    try {
      const user = await getCurrentUser();
      authorize(user, access);

      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: flatten(parsed.error) };
      }

      const ip = clientIp(await headers());
      const data = await handler(parsed.data, { user, ip } as Ctx<A>);
      return { ok: true, data };
    } catch (e) {
      unstable_rethrow(e); // let redirect()/notFound() through
      if (e instanceof DomainError) return { ok: false, error: e.message, fieldErrors: e.fieldErrors };
      console.error("[action] unexpected error", e);
      return { ok: false, error: "Something went wrong. Please try again." };
    }
  };
}

function authorize(user: SessionUser | null, access: Access) {
  if ("public" in access) return;
  if (!user) throw new ForbiddenError("Please sign in again.");
  const pendingOk = "signedIn" in access && access.allowPendingPasswordChange;
  if (user.mustChangePassword && !pendingOk) throw new ForbiddenError("Change your password first.");
  if ("permission" in access && !can(user.role, access.permission)) throw new ForbiddenError();
  if ("roles" in access && !access.roles.includes(user.role)) throw new ForbiddenError();
}

function flatten(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
