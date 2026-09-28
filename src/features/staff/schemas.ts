import { z } from "zod";
import { emailSchema, idNumberSchema } from "@/features/auth/schemas";

export const STAFF_ROLES = ["LAB_STAFF", "SUPER_ADMIN"] as const;
export const STAFF_ROLE_LABELS = { LAB_STAFF: "Lab staff", SUPER_ADMIN: "Super admin" } as const;

const name = (label: string) => z.string().trim().min(1, `${label} is required`).max(60);

export const StaffSchema = z.object({
  idNumber: idNumberSchema,
  firstName: name("First name"),
  lastName: name("Last name"),
  email: emailSchema,
  role: z.enum(STAFF_ROLES, { message: "Select a role" }),
});

export const StaffRoleSchema = z.object({ id: z.string().min(1), role: z.enum(STAFF_ROLES) });
export const StaffStatusSchema = z.object({ id: z.string().min(1), status: z.enum(["ACTIVE", "INACTIVE"]) });
export const StaffIdSchema = z.object({ id: z.string().min(1) });

export type StaffInput = z.infer<typeof StaffSchema>;
