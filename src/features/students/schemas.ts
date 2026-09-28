import { z } from "zod";
import { emailSchema, idNumberSchema } from "@/features/auth/schemas";

const name = (label: string) => z.string().trim().min(1, `${label} is required`).max(60);
// Accepts null as well as "" so parsing an already-parsed value is harmless.
const optionalName = z
  .string()
  .trim()
  .max(60)
  .nullish()
  .transform((v) => v || null);
const yearLevel = z.coerce.number().int().min(1, "Select a year level").max(4, "Year level is 1–4");

/** Fields a student can change about themselves. ID number is fixed once issued. */
export const ProfileSchema = z.object({
  firstName: name("First name"),
  middleName: optionalName,
  lastName: name("Last name"),
  email: emailSchema,
  courseId: z.string().min(1, "Select a course"),
  yearLevel,
});

/** Staff create/edit: everything a student can edit, plus the ID number. */
export const StudentSchema = ProfileSchema.extend({ idNumber: idNumberSchema });
export const UpdateStudentSchema = StudentSchema.extend({ id: z.string().min(1) });

export const StudentIdSchema = z.object({ id: z.string().min(1) });

export const STUDENT_STATUSES = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

export const StudentListQuerySchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  courseId: z.string().optional().catch(undefined),
  yearLevel: z.coerce.number().int().min(1).max(4).optional().catch(undefined),
  status: z.enum([...STUDENT_STATUSES, "ALL"]).catch("ACTIVE"),
  page: z.coerce.number().int().min(1).catch(1),
});

export type ProfileFormValues = z.input<typeof ProfileSchema>;
export type ProfileInput = z.output<typeof ProfileSchema>;
export type StudentFormValues = z.input<typeof StudentSchema>;
export type StudentInput = z.output<typeof StudentSchema>;
export type UpdateStudentInput = z.output<typeof UpdateStudentSchema>;
export type StudentListQuery = z.output<typeof StudentListQuerySchema>;

// --- Bulk import -------------------------------------------------------------

export const MAX_IMPORT_ROWS = 2000;

export const TEMPLATE_CSV =
  "id_number,first_name,middle_name,last_name,email,course,year_level\n2025-0001,Juan,Santos,Dela Cruz,juan.delacruz@example.edu,BSIT,1\n";

/** One spreadsheet row, after column names are normalised. Course is given by code (e.g. "BSIT"). */
export const ImportRowSchema = z.object({
  idNumber: idNumberSchema,
  firstName: name("First name"),
  middleName: optionalName,
  lastName: name("Last name"),
  email: emailSchema,
  course: z.string().trim().toUpperCase().min(1, "Course is required"),
  yearLevel,
});

export type ImportRow = z.output<typeof ImportRowSchema>;
