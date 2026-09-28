import type { NextAuthConfig } from "next-auth";

/**
 * The database-free part of the Auth.js config, used by proxy.ts to read the session cookie
 * cheaply on every navigation. The full config (lib/auth.ts) adds the credentials provider
 * and a jwt callback that re-validates the user against the database.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  // Rolling cookie lifetime. The absolute limit (Settings.sessionMaxAgeHours) is enforced in lib/auth.ts.
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  trustHost: true,
  providers: [],
  callbacks: {
    session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.sub!,
        name: token.name ?? "",
        role: token.role,
        idNumber: token.idNumber,
        mustChangePassword: token.mustChangePassword,
      };
      return session;
    },
  },
} satisfies NextAuthConfig;
