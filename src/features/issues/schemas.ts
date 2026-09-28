import { z } from "zod";

export const ISSUE_CATEGORIES = ["NO_INTERNET", "PERIPHERAL", "DISPLAY", "SOFTWARE", "HARDWARE", "OTHER"] as const;

export const ISSUE_CATEGORY_LABELS: Record<(typeof ISSUE_CATEGORIES)[number], string> = {
  NO_INTERNET: "No internet",
  PERIPHERAL: "Mouse / keyboard",
  DISPLAY: "Monitor / display",
  SOFTWARE: "Software won't work",
  HARDWARE: "PC won't start / hardware",
  OTHER: "Something else",
};

export const ReportIssueSchema = z.object({
  category: z.enum(ISSUE_CATEGORIES, { message: "Pick what's wrong" }),
  description: z.string().trim().min(5, "Describe the problem in a few words").max(500),
});

export const UpdateIssueSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["IN_PROGRESS", "RESOLVED"]),
  // When resolving: put the PC back into service (if nothing else is wrong with it).
  returnToService: z.boolean().default(true),
});

export type ReportIssueInput = z.infer<typeof ReportIssueSchema>;
