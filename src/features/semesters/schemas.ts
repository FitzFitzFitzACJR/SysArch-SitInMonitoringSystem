import { z } from "zod";
import { isoDate } from "@/features/reservations/schemas";

export const SemesterSchema = z
  .object({
    name: z.string().trim().min(3, "Name is required").max(60),
    startsOn: isoDate,
    endsOn: isoDate,
    sessionAllotment: z.coerce.number().int().min(0).max(1000),
  })
  .refine((v) => v.endsOn > v.startsOn, { path: ["endsOn"], message: "Must end after it starts" });

export const UpdateSemesterSchema = SemesterSchema.and(z.object({ id: z.string().min(1) }));
export const SemesterIdSchema = z.object({ id: z.string().min(1) });

export type SemesterFormValues = z.input<typeof SemesterSchema>;
export type SemesterInput = z.output<typeof SemesterSchema>;
