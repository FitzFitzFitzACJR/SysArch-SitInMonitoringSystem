import { z } from "zod";

const ymd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .catch(undefined);
const id = z.string().min(1).optional().catch(undefined);

/**
 * Report filters, read from the URL (so a filtered report is a shareable link and the
 * export buttons reuse exactly the same query). Invalid values fall back to defaults.
 */
export const ReportFilterSchema = z.object({
  from: ymd, // lab-local dates, inclusive
  to: ymd,
  labId: id,
  courseId: id,
  languageId: id,
  yearLevel: z.coerce.number().int().min(1).max(4).optional().catch(undefined),
  status: z.enum(["COMPLETED", "CANCELLED", "ALL"]).catch("COMPLETED"),
  page: z.coerce.number().int().min(1).catch(1),
});

export type ReportFilter = z.output<typeof ReportFilterSchema>;

export const REPORT_PAGE_SIZE = 25;
export const MAX_EXPORT_ROWS = 10_000;
