import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// Only answers "is there a session cookie at all?" and sends anonymous visitors to /login.
// Role routing and forced password changes are decided by the pages themselves
// (lib/session.ts) against fresh database state. Doing it here from cookie claims could
// disagree with the database after a role change and bounce the user between redirects.
const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (req.auth || isPublic) return NextResponse.next();

  const login = new URL("/login", req.url);
  if (pathname !== "/") login.searchParams.set("callbackUrl", pathname + search);
  return NextResponse.redirect(login);
});

export const config = {
  // Skip API routes (they authenticate themselves), Next internals and static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|webmanifest)$).*)"],
};
