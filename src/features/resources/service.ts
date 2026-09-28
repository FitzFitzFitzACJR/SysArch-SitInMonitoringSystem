import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { DomainError, NotFoundError } from "@/lib/errors";
import { deleteFile, saveFile } from "@/lib/storage";
import { writeAudit } from "@/features/audit/service";
import { MAX_RESOURCE_BYTES, RESOURCE_TYPES, type ResourceInput } from "./schemas";

type Actor = { id: string; ip: string | null };

/** A resource is either a link or an uploaded file, never both. */
export async function createResource(input: ResourceInput, actor: Actor) {
  const hasFile = Boolean(input.file && input.file.size > 0);
  if (hasFile === Boolean(input.url)) throw new DomainError("Add either a link or a file.");

  let stored: { key: string; url: string; name: string; type: string } | null = null;
  if (hasFile) {
    const file = input.file!;
    if (file.size > MAX_RESOURCE_BYTES) throw new DomainError("Files must be 5 MB or smaller.");
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const type = RESOURCE_TYPES[ext];
    if (!type) throw new DomainError(`That file type isn't allowed. Use: ${Object.keys(RESOURCE_TYPES).join(", ")}.`);
    const saved = await saveFile(
      `resources/${randomBytes(12).toString("hex")}.${ext}`,
      Buffer.from(await file.arrayBuffer()),
      type,
    );
    stored = { ...saved, name: file.name.slice(0, 200), type };
  }

  try {
    return await db.$transaction(async (tx) => {
      const r = await tx.resource.create({
        data: {
          title: input.title,
          description: input.description,
          url: stored ? stored.url : input.url,
          fileKey: stored?.key ?? null,
          fileName: stored?.name ?? null,
          mimeType: stored?.type ?? null,
          createdById: actor.id,
        },
      });
      await writeAudit(tx, {
        actorId: actor.id,
        action: "resource.create",
        entityType: "Resource",
        entityId: r.id,
        details: { title: r.title, file: r.fileName },
        ipAddress: actor.ip,
      });
      return r;
    });
  } catch (e) {
    if (stored) await deleteFile(stored.url); // don't leave an orphaned upload
    throw e;
  }
}

export async function setResourceActive(id: string, isActive: boolean, actor: Actor) {
  return db.$transaction(async (tx) => {
    const r = await tx.resource.findUnique({ where: { id } });
    if (!r) throw new NotFoundError("Resource");
    await tx.resource.update({ where: { id }, data: { isActive } });
    await writeAudit(tx, {
      actorId: actor.id,
      action: isActive ? "resource.show" : "resource.hide",
      entityType: "Resource",
      entityId: id,
      details: { title: r.title },
      ipAddress: actor.ip,
    });
  });
}

export async function deleteResource(id: string, actor: Actor) {
  const r = await db.$transaction(async (tx) => {
    const found = await tx.resource.findUnique({ where: { id } });
    if (!found) throw new NotFoundError("Resource");
    await tx.resource.delete({ where: { id } });
    await writeAudit(tx, {
      actorId: actor.id,
      action: "resource.delete",
      entityType: "Resource",
      entityId: id,
      details: { title: found.title },
      ipAddress: actor.ip,
    });
    return found;
  });
  if (r.fileKey && r.url) await deleteFile(r.url);
}

export function listResources(activeOnly: boolean) {
  return db.resource.findMany({
    where: activeOnly ? { isActive: true } : {},
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { firstName: true, lastName: true } } },
  });
}
