import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import { DomainError } from "@/lib/errors";
import { hashPassword, isLegacyHash, verifyAgainstDummy, verifyPassword } from "@/lib/password";
import { getSettings } from "@/features/settings/queries";
import { getSessionAllotment } from "@/features/semesters/queries";
import { adjustBalance } from "@/features/points/ledger";
import { uniqueViolation } from "@/lib/prisma-errors";

export const UNIQUE_MESSAGES = {
  email: "That email is already registered.",
  idNumber: "That ID number is already registered.",
};
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "./schemas";

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export type LoginErrorCode = "invalid" | "locked" | "inactive" | "rate_limited";

export class LoginError extends Error {
  constructor(readonly code: LoginErrorCode) {
    super(code);
  }
}

// Per-IP limit on failed attempts, on top of the per-account lockout from Settings.
const IP_WINDOW_MS = 15 * 60_000;
const IP_MAX_FAILURES = 30;

export type AuthenticatedUser = {
  id: string;
  role: "STUDENT" | "LAB_STAFF" | "SUPER_ADMIN";
  name: string;
  idNumber: string;
  mustChangePassword: boolean;
};

export async function verifyLogin({ idNumber, password }: LoginInput, ip: string): Promise<AuthenticatedUser> {
  const settings = await getSettings();

  const recentFailures = await db.loginAttempt.count({
    where: { ip, success: false, createdAt: { gte: new Date(Date.now() - IP_WINDOW_MS) } },
  });
  if (recentFailures >= IP_MAX_FAILURES) throw new LoginError("rate_limited");

  const user = await db.user.findUnique({ where: { idNumber } });
  const record = (success: boolean) => db.loginAttempt.create({ data: { identifier: idNumber, ip, success } });

  if (!user) {
    await verifyAgainstDummy(password);
    await record(false);
    throw new LoginError("invalid");
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await record(false);
    throw new LoginError("locked");
  }

  if (!(await verifyPassword(user.passwordHash, password))) {
    const failed = user.failedLogins + 1;
    const lock = failed >= settings.maxLoginAttempts;
    await db.user.update({
      where: { id: user.id },
      data: lock
        ? { failedLogins: 0, lockedUntil: new Date(Date.now() + settings.lockoutMinutes * 60_000) }
        : { failedLogins: failed },
    });
    await record(false);
    throw new LoginError(lock ? "locked" : "invalid");
  }

  // Checked only after the password is verified, so a wrong password never reveals account status.
  if (user.status !== "ACTIVE") {
    await record(false);
    throw new LoginError("inactive");
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      failedLogins: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      // Transparently upgrade bcrypt hashes imported from the PHP app.
      ...(isLegacyHash(user.passwordHash) && { passwordHash: await hashPassword(password) }),
    },
  });
  await record(true);

  return {
    id: user.id,
    role: user.role,
    name: `${user.firstName} ${user.lastName}`,
    idNumber: user.idNumber,
    mustChangePassword: user.mustChangePassword,
  };
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export async function registerStudent(input: RegisterInput) {
  const course = await db.course.findFirst({ where: { id: input.courseId, isActive: true } });
  if (!course) throw new DomainError("Select a valid course.", { courseId: ["Select a valid course"] });

  const allotment = await getSessionAllotment();
  const passwordHash = await hashPassword(input.password);

  try {
    return await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          idNumber: input.idNumber,
          email: input.email,
          firstName: input.firstName,
          middleName: input.middleName || null,
          lastName: input.lastName,
          courseId: course.id,
          yearLevel: input.yearLevel,
          passwordHash,
        },
      });
      await adjustBalance(tx, {
        userId: user.id,
        sessionsDelta: allotment.sessions,
        reason: "SEMESTER_RESET",
        note: "Initial session allotment",
        semesterId: allotment.semesterId,
      });
      return user;
    });
  } catch (e) {
    throw uniqueViolation(e, UNIQUE_MESSAGES) ?? e;
  }
}

// ---------------------------------------------------------------------------
// Password change / reset
// ---------------------------------------------------------------------------

export async function changePassword(userId: string, input: ChangePasswordInput) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (!(await verifyPassword(user.passwordHash, input.currentPassword))) {
    throw new DomainError("Current password is incorrect.", { currentPassword: ["Incorrect password"] });
  }
  await db.user.update({
    where: { id: userId },
    data: {
      passwordHash: await hashPassword(input.newPassword),
      mustChangePassword: false,
      // Invalidates every other session for this user (see the jwt callback in lib/auth.ts).
      passwordChangedAt: new Date(),
    },
  });
  return user;
}

const RESET_TOKEN_TTL_MS = 60 * 60_000;
const RESET_COOLDOWN_MS = 2 * 60_000;

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/** Always resolves the same way whether or not the email exists, to avoid account enumeration. */
export async function requestPasswordReset({ email }: ForgotPasswordInput): Promise<void> {
  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.status !== "ACTIVE") return;

  const recent = await db.passwordResetToken.findFirst({
    where: { userId: user.id, createdAt: { gte: new Date(Date.now() - RESET_COOLDOWN_MS) } },
  });
  if (recent) return;

  await sendPasswordLink(user, "reset");
}

const INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60_000;

/**
 * Emails a one-time link to set a password. Used for "forgot password" and for accounts
 * created by staff (single add, bulk import, staff invites), so nobody ever sends or
 * stores a plain-text initial password.
 */
export async function sendPasswordLink(
  user: { id: string; email: string; firstName: string; idNumber: string },
  kind: "reset" | "invite",
) {
  const token = randomBytes(32).toString("base64url");
  const ttl = kind === "reset" ? RESET_TOKEN_TTL_MS : INVITE_TOKEN_TTL_MS;
  await db.$transaction([
    // Only the newest link works.
    db.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } }),
    db.passwordResetToken.create({
      data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + ttl) },
    }),
  ]);

  const link = `${env.APP_URL}/reset-password?token=${token}`;
  await sendEmail(
    kind === "reset"
      ? {
          to: user.email,
          subject: "Reset your CCS Sit-In password",
          text: `Hi ${user.firstName},\n\nUse this link to set a new password. It expires in 1 hour.\n\n${link}\n\nIf you didn't ask for this, you can ignore this email.`,
        }
      : {
          to: user.email,
          subject: "Your CCS Sit-In account is ready",
          text: `Hi ${user.firstName},\n\nAn account has been created for you on the CCS Sit-In Monitoring System.\nYour ID number is ${user.idNumber}. Set your password with this link (valid for 7 days):\n\n${link}\n`,
        },
  );
}

export async function resetPassword({ token, newPassword }: ResetPasswordInput) {
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash: sha256(token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new DomainError("This reset link is invalid or has expired. Request a new one.");
  }
  const passwordHash = await hashPassword(newPassword);
  await db.$transaction(async (tx) => {
    // Conditional update so two simultaneous submissions can't both use the same token.
    const { count } = await tx.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (count === 0) throw new DomainError("This reset link has already been used.");
    await tx.user.update({
      where: { id: record.userId },
      data: {
        passwordHash,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
        failedLogins: 0,
        lockedUntil: null,
      },
    });
  });
}
