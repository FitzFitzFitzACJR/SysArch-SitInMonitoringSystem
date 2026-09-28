import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

/**
 * The single settings row, memoised per request. The seed creates it; the fallback create
 * covers a fresh database where the seed hasn't run, so the app never crashes on a missing row.
 */
export const getSettings = cache(async () => {
  const settings = await db.settings.findUnique({ where: { id: 1 } });
  return settings ?? db.settings.create({ data: { id: 1 } });
});
