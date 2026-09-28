import { z } from "zod";

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date")
  .transform((v) => new Date(`${v}T00:00:00Z`))
  .refine((d) => !Number.isNaN(d.getTime()), "Pick a valid date");

export const ReservationSchema = z.object({
  date: isoDate,
  labId: z.string().min(1, "Select a lab"),
  timeSlotId: z.string().min(1, "Select a time slot"),
  // Optional: without a PC, the booking holds a place in the lab and a PC is assigned at check-in.
  computerId: z
    .string()
    .nullish()
    .transform((v) => v || null),
  languageId: z.string().min(1, "Select a language"),
  purpose: z.string().trim().min(3, "Say briefly what you'll work on").max(200),
});

export const AvailabilitySchema = z.object({ labId: z.string().min(1), date: isoDate });

export const DecideSchema = z
  .object({
    id: z.string().min(1),
    approve: z.boolean(),
    note: z.string().trim().max(200).optional(),
  })
  .refine((v) => v.approve || (v.note && v.note.length >= 3), {
    path: ["note"],
    message: "Tell the student why",
  });

export const ReservationIdSchema = z.object({ id: z.string().min(1) });

export type ReservationFormValues = z.input<typeof ReservationSchema>;
export type ReservationInput = z.output<typeof ReservationSchema>;
