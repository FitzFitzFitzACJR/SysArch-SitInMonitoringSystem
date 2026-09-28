import type { Role } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface User {
    role?: Role;
    idNumber?: string;
    mustChangePassword?: boolean;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      role: Role;
      idNumber: string;
      mustChangePassword: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    idNumber: string;
    mustChangePassword: boolean;
    /** When the user actually signed in (ms). Enforces Settings.sessionMaxAgeHours as an absolute limit. */
    loginAt: number;
  }
}
