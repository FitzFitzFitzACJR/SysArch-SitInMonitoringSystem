import { z } from "zod";

/** What a student's QR code contains. The prefix stops unrelated QR codes matching anything. */
export const QR_PREFIX = "CCSSITIN:";
export const qrPayload = (token: string) => `${QR_PREFIX}${token}`;

export const LookupSchema = z.object({
  // A scanned QR payload, or an ID number typed by staff.
  query: z.string().trim().min(1, "Scan a QR code or enter an ID number").max(100),
});

export const StartSitInSchema = z.object({
  studentId: z.string().min(1),
  labId: z.string().min(1, "Select a lab"),
  computerId: z.string().min(1, "Select a computer"),
  languageId: z.string().min(1, "Select a language"),
  purpose: z
    .string()
    .trim()
    .max(200)
    .nullish()
    .transform((v) => v || null),
});

export const EndSitInSchema = z.object({ id: z.string().min(1), reward: z.boolean() });

export const CancelSitInSchema = z.object({
  id: z.string().min(1),
  reason: z.string().trim().min(3, "Say why (e.g. started by mistake)").max(200),
});

export const LabIdSchema = z.object({ labId: z.string().min(1) });

export type StartSitInInput = z.output<typeof StartSitInSchema>;
