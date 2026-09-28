import { z } from "zod";

export const FEEDBACK_CATEGORIES = ["EQUIPMENT", "FACILITIES", "STAFF", "SERVICES", "OTHER"] as const;
export const FEEDBACK_CATEGORY_LABELS: Record<(typeof FEEDBACK_CATEGORIES)[number], string> = {
  EQUIPMENT: "Equipment",
  FACILITIES: "Facilities",
  STAFF: "Staff",
  SERVICES: "Services",
  OTHER: "Other",
};

export const FeedbackSchema = z.object({
  labId: z.string().min(1, "Select a lab"),
  rating: z.coerce.number().int().min(1, "Pick a rating").max(5),
  category: z.enum(FEEDBACK_CATEGORIES, { message: "Pick a category" }),
  comments: z.string().trim().min(5, "Tell us a bit more").max(2000),
  suggestions: z
    .string()
    .trim()
    .max(2000)
    .nullish()
    .transform((v) => v || null),
});

export const FeedbackIdSchema = z.object({ id: z.string().min(1) });
export const FeedbackReadSchema = FeedbackIdSchema.extend({ read: z.boolean() });

export type FeedbackFormValues = z.input<typeof FeedbackSchema>;
export type FeedbackInput = z.output<typeof FeedbackSchema>;
