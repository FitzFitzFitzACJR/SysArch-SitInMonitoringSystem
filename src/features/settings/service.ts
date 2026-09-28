import "server-only";
import { db } from "@/lib/db";
import { writeAudit } from "@/features/audit/service";
import type { SettingsInput } from "./schemas";

export async function updateSettings(input: SettingsInput, actor: { id: string; ip: string | null }) {
  return db.$transaction(async (tx) => {
    const before =
      (await tx.settings.findUnique({ where: { id: 1 } })) ?? (await tx.settings.create({ data: { id: 1 } }));

    // Changing the lab rules makes every student re-accept them before their next sit-in.
    const rulesChanged = before.rulesText !== input.rulesText;
    const after = await tx.settings.update({
      where: { id: 1 },
      data: {
        ...input,
        rulesVersion: rulesChanged ? before.rulesVersion + 1 : before.rulesVersion,
        updatedById: actor.id,
      },
    });

    await writeAudit(tx, {
      actorId: actor.id,
      action: "settings.update",
      entityType: "Settings",
      entityId: "1",
      details: { changed: diff(before, after) },
      ipAddress: actor.ip,
    });
    return after;
  });
}

function diff(before: Record<string, unknown>, after: Record<string, unknown>) {
  const ignored = new Set(["updatedAt", "updatedById"]);
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(after)) {
    if (!ignored.has(key) && before[key] !== after[key]) {
      changes[key] = { from: before[key], to: after[key] };
    }
  }
  return changes as Record<string, { from: string | number | boolean | null; to: string | number | boolean | null }>;
}
