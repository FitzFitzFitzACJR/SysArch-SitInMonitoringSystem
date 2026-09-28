import "server-only";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { resolveRange } from "@/features/reports/queries";

export const AUDIT_PAGE_SIZE = 50;

export const AuditFilterSchema = z.object({
  area: z
    .string()
    .regex(/^[a-zA-Z]+$/)
    .optional()
    .catch(undefined), // "sitIn", "student", …
  actorId: z.string().min(1).optional().catch(undefined),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .catch(undefined),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
});
export type AuditFilter = z.output<typeof AuditFilterSchema>;

async function whereFor(f: AuditFilter): Promise<Prisma.AuditLogWhereInput> {
  const range = await resolveRange({ from: f.from, to: f.to });
  return {
    createdAt: { gte: range.start, lt: range.end },
    ...(f.area && { action: { startsWith: `${f.area}.` } }),
    ...(f.actorId && { actorId: f.actorId }),
  };
}

const include = { actor: { select: { firstName: true, lastName: true, idNumber: true, role: true } } } as const;

export async function listAudit(f: AuditFilter) {
  const where = await whereFor(f);
  const [rows, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (f.page - 1) * AUDIT_PAGE_SIZE,
      take: AUDIT_PAGE_SIZE,
      include,
    }),
    db.auditLog.count({ where }),
  ]);
  return { rows, total, pageCount: Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE)) };
}

export async function auditForExport(f: AuditFilter) {
  return db.auditLog.findMany({ where: await whereFor(f), orderBy: { createdAt: "asc" }, take: 10_000, include });
}

/** Filter options: the areas that have entries ("sitIn" from "sitIn.start") and the staff who acted. */
export async function auditFilterOptions() {
  const [actions, actors] = await Promise.all([
    db.auditLog.findMany({ distinct: ["action"], select: { action: true } }),
    db.user.findMany({
      where: { auditLogs: { some: {} } },
      orderBy: { lastName: "asc" },
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);
  const areas = [...new Set(actions.map((a) => a.action.split(".")[0]))].sort();
  return { areas, actors };
}
