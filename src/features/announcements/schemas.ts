import { z } from "zod";

// "YYYY-MM-DDTHH:MM" from <input type="datetime-local">, interpreted in the lab's timezone
// by the service. Empty = not set.
const localDateTime = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v), "Pick a date and time")
  .transform((v) => v || null);

export const AUDIENCES = ["ALL", "LAB", "COURSE"] as const;

export const AnnouncementSchema = z
  .object({
    title: z.string().trim().min(3, "Title is required").max(150),
    body: z.string().trim().min(1, "Write something").max(5000),
    pinned: z.boolean(),
    publishAt: localDateTime, // null = publish now
    expiresAt: localDateTime, // null = never
    audience: z.enum(AUDIENCES),
    labId: z
      .string()
      .nullish()
      .transform((v) => v || null),
    courseId: z
      .string()
      .nullish()
      .transform((v) => v || null),
  })
  .refine((v) => v.audience !== "LAB" || v.labId, { path: ["labId"], message: "Select a lab" })
  .refine((v) => v.audience !== "COURSE" || v.courseId, { path: ["courseId"], message: "Select a course" })
  .refine((v) => !v.publishAt || !v.expiresAt || v.expiresAt > v.publishAt, {
    path: ["expiresAt"],
    message: "Must be after the publish time",
  });

export const UpdateAnnouncementSchema = AnnouncementSchema.and(z.object({ id: z.string().min(1) }));
export const AnnouncementIdSchema = z.object({ id: z.string().min(1) });

export type AnnouncementFormValues = z.input<typeof AnnouncementSchema>;
export type AnnouncementInput = z.output<typeof AnnouncementSchema>;
