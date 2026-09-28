import { z } from "zod";

// One form, two kinds of adjustment. Negative values are allowed (penalties, corrections)
// but zero isn't, and every change needs a reason for the ledger.
export const AwardSchema = z.object({
  studentId: z.string().min(1),
  kind: z.enum(["points", "sessions"]),
  amount: z.coerce
    .number()
    .int("Whole numbers only")
    .min(-50, "At most 50 at a time")
    .max(50, "At most 50 at a time")
    .refine((n) => n !== 0, "Enter a non-zero amount"),
  reason: z.string().trim().min(3, "Say why (students see this)").max(200),
});

export const LeaderboardQuerySchema = z.object({
  semester: z.string().optional().catch(undefined), // semester id, or "all"
});

export type AwardFormValues = z.input<typeof AwardSchema>;
export type AwardInput = z.output<typeof AwardSchema>;
