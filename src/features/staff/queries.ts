import "server-only";
import { db } from "@/lib/db";

export function listStaff() {
  return db.user
    .findMany({
      where: { role: { in: ["LAB_STAFF", "SUPER_ADMIN"] } },
      orderBy: [{ status: "asc" }, { lastName: "asc" }],
      select: {
        id: true,
        idNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
        passwordHash: true,
      },
    })
    .then((rows) =>
      // Only expose whether a password has been set, never the hash.
      rows.map(({ passwordHash, ...r }) => ({ ...r, passwordPending: passwordHash.startsWith("!") })),
    );
}

export type StaffRow = Awaited<ReturnType<typeof listStaff>>[number];
