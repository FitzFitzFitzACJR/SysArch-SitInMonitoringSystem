import { z } from "zod";
import { hhmmToMinutes } from "@/lib/time";

export const COMPUTER_STATES = ["ACTIVE", "LOCKED", "MAINTENANCE"] as const;
export type ComputerState = (typeof COMPUTER_STATES)[number];

export const MAX_COMPUTERS_PER_LAB = 200;

// Empty = "use the default lab hours from Settings".
const optionalTime = z
  .string()
  .trim()
  .refine((v) => v === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(v), "Use HH:MM")
  .transform((v) => (v === "" ? null : hhmmToMinutes(v)));

const labFields = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "Code is required")
    .max(10)
    .regex(/^[A-Z0-9-]+$/, "Letters, numbers and dashes only"),
  name: z.string().trim().min(1, "Name is required").max(60),
  gridColumns: z.coerce.number().int().min(1).max(20),
  opensAt: optionalTime,
  closesAt: optionalTime,
  isActive: z.boolean(),
});

const hoursRule = <T extends { opensAt: number | null; closesAt: number | null }>(v: T) =>
  v.opensAt == null || v.closesAt == null || v.opensAt < v.closesAt;
const hoursMessage = { path: ["closesAt"], message: "Closing time must be after opening time" };

export const CreateLabSchema = labFields
  .extend({ computerCount: z.coerce.number().int().min(1).max(MAX_COMPUTERS_PER_LAB) })
  .refine(hoursRule, hoursMessage);
export const UpdateLabSchema = labFields.extend({ id: z.string().min(1) }).refine(hoursRule, hoursMessage);

export const ResizeLabSchema = z.object({
  labId: z.string().min(1),
  computerCount: z.coerce.number().int().min(1).max(MAX_COMPUTERS_PER_LAB),
});

export const SetComputerStateSchema = z.object({
  labId: z.string().min(1),
  computerIds: z.array(z.string().min(1)).min(1, "Select at least one computer").max(MAX_COMPUTERS_PER_LAB),
  state: z.enum(COMPUTER_STATES),
  note: z.string().trim().max(200).optional(),
});

export const BulkLabSchema = z.object({
  labId: z.string().min(1),
  mode: z.enum(["unlockAll", "lockAll"]),
});

export type LabFormValues = z.input<typeof CreateLabSchema>;
export type CreateLabInput = z.output<typeof CreateLabSchema>;
export type UpdateLabInput = z.output<typeof UpdateLabSchema>;
