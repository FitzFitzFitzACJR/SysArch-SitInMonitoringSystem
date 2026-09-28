import "server-only";
import NextAuth, { CredentialsSignin } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { LoginSchema } from "@/features/auth/schemas";
import { LoginError, verifyLogin, type LoginErrorCode } from "@/features/auth/service";
import { getSettings } from "@/features/settings/queries";
import { db } from "./db";
import { clientIp } from "./request";

class LoginFailed extends CredentialsSignin {
  constructor(code: LoginErrorCode) {
    super();
    this.code = code;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { idNumber: {}, password: {} },
      async authorize(raw, request) {
        const parsed = LoginSchema.safeParse(raw);
        if (!parsed.success) throw new LoginFailed("invalid");
        try {
          return await verifyLogin(parsed.data, clientIp(request.headers));
        } catch (e) {
          if (e instanceof LoginError) throw new LoginFailed(e.code);
          throw e;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        // Fresh sign-in: `user` is what authorize() returned.
        return {
          ...token,
          sub: user.id,
          name: user.name,
          role: user.role!,
          idNumber: user.idNumber!,
          mustChangePassword: user.mustChangePassword!,
          loginAt: Date.now(),
        };
      }
      return revalidate(token);
    },
  },
});

/**
 * Runs whenever the server reads the session. Returning null signs the user out, so role
 * changes, deactivation, password changes and the absolute session limit take effect on
 * the next request instead of when the cookie happens to expire.
 */
async function revalidate(token: JWT): Promise<JWT | null> {
  if (!token.sub || !token.loginAt) return null;

  const [user, settings] = await Promise.all([
    db.user.findUnique({
      where: { id: token.sub },
      select: {
        status: true,
        role: true,
        firstName: true,
        lastName: true,
        mustChangePassword: true,
        passwordChangedAt: true,
      },
    }),
    getSettings(),
  ]);

  if (!user || user.status !== "ACTIVE") return null;
  if (user.passwordChangedAt.getTime() > token.loginAt) return null;
  if (Date.now() - token.loginAt > settings.sessionMaxAgeHours * 3_600_000) return null;

  return {
    ...token,
    name: `${user.firstName} ${user.lastName}`,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  };
}
