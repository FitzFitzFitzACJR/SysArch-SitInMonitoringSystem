import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { Tx } from "@/lib/db";

export type AuditEntry = {
  actorId: string;
  action: string; // "<entity>.<verb>", e.g. "computer.lock"
  entityType: string;
  entityId?: string | null;
  details?: Prisma.InputJsonValue;
  ipAddress?: string | null;
};

/**
 * Written inside the same transaction as the change it describes, so the log can never
 * claim something happened that was rolled back (or miss something that wasn't).
 */
export function writeAudit(tx: Tx, entry: AuditEntry) {
  return tx.auditLog.create({ data: entry });
}
