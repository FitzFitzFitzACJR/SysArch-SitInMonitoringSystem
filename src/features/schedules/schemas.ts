import { z } from "zod";
import { hhmmToMinutes } from "@/lib/time";

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM")
  .transform(hhmmToMinutes);

export const ScheduleSchema = z
  .object({
    labId: z.string().min(1, "Select a lab"),
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    startMinute: time,
    endMinute: time,
    courseCode: z.string().trim().toUpperCase().min(1, "Course code is required").max(30),
    instructor: z.string().trim().min(1, "Instructor is required").max(100),
  })
  .refine((v) => v.startMinute < v.endMinute, { path: ["endMinute"], message: "End must be after start" });

export const UpdateScheduleSchema = ScheduleSchema.and(z.object({ id: z.string().min(1) }));
export const ScheduleIdSchema = z.object({ id: z.string().min(1) });

export type ScheduleFormValues = z.input<typeof ScheduleSchema>;
export type ScheduleInput = z.output<typeof ScheduleSchema>;
