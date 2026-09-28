import { writeAudit } from "@/features/audit/service";
import { AuditFilterSchema, auditForExport } from "@/features/audit/queries";
import { toCsv } from "@/features/reports/csv";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { clientIp } from "@/lib/request";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!can(session.user.role, "audit:view")) return new Response("Forbidden", { status: 403 });

  const filter = AuditFilterSchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  const rows = await auditForExport(filter);
  await writeAudit(db, {
    actorId: session.user.id,
    action: "audit.export",
    entityType: "AuditLog",
    details: { rows: rows.length },
    ipAddress: clientIp(req.headers),
  });

  const csv = toCsv(
    ["When (UTC)", "Actor ID", "Actor", "Action", "Entity", "Entity ID", "IP", "Details"],
    rows.map((r) => [
      r.createdAt,
      r.actor.idNumber,
      `${r.actor.firstName} ${r.actor.lastName}`,
      r.action,
      r.entityType,
      r.entityId ?? "",
      r.ipAddress ?? "",
      r.details ? JSON.stringify(r.details) : "",
    ]),
  );
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit-log.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
