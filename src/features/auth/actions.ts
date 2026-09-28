"use server";

import { AuthError } from "next-auth";
import { createAction } from "@/lib/action";
import type { ActionResult } from "@/lib/action-result";
import { signIn, signOut } from "@/lib/auth";
import { homePathFor } from "@/lib/permissions";
import {
  ChangePasswordSchema,
  ForgotPasswordSchema,
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
  type LoginInput,
} from "./schemas";
import { changePassword, registerStudent, requestPasswordReset, resetPassword, type LoginErrorCode } from "./service";

const LOGIN_MESSAGES: Record<LoginErrorCode, string> = {
  invalid: "Incorrect ID number or password.",
  locked: "Too many failed attempts. This account is temporarily locked — try again later.",
  inactive: "This account is inactive. Please contact the lab staff.",
  rate_limited: "Too many attempts from this device. Please wait a few minutes.",
};

// signIn() validates, verifies and sets the cookie; on success it throws a redirect, which
// must propagate. Only AuthErrors are turned into messages.
export async function loginAction(input: LoginInput, callbackUrl?: string): Promise<ActionResult> {
  const parsed = LoginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: LOGIN_MESSAGES.invalid };
  try {
    await signIn("credentials", { ...parsed.data, redirectTo: safeCallback(callbackUrl) ?? "/" });
    return { ok: true, data: undefined };
  } catch (e) {
    if (e instanceof AuthError) {
      const code = ("code" in e ? e.code : "invalid") as LoginErrorCode;
      return { ok: false, error: LOGIN_MESSAGES[code] ?? LOGIN_MESSAGES.invalid };
    }
    throw e;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export const registerAction = createAction(RegisterSchema, { public: true }, async (input) => {
  await registerStudent(input);
  // Sign the new student straight in.
  await signIn("credentials", { idNumber: input.idNumber, password: input.password, redirectTo: "/dashboard" });
});

export const changePasswordAction = createAction(
  ChangePasswordSchema,
  { signedIn: true, allowPendingPasswordChange: true },
  async (input, { user }) => {
    const updated = await changePassword(user.id, input);
    // Changing the password invalidates existing sessions, including this one, so sign in again.
    await signIn("credentials", {
      idNumber: updated.idNumber,
      password: input.newPassword,
      redirectTo: homePathFor(user.role),
    });
  },
);

export const forgotPasswordAction = createAction(ForgotPasswordSchema, { public: true }, (input) =>
  requestPasswordReset(input),
);

export const resetPasswordAction = createAction(ResetPasswordSchema, { public: true }, (input) => resetPassword(input));

/** Only same-site relative paths, so the login page can't be used as an open redirect. */
function safeCallback(url?: string): string | undefined {
  return url && url.startsWith("/") && !url.startsWith("//") ? url : undefined;
}
