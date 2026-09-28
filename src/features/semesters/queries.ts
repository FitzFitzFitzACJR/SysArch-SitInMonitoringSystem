import "server-only";
import type { Tx } from "@/lib/db";
import { db } from "@/lib/db";
import { dateOnlyInTz } from "@/lib/time";

/** The semester whose date range contains `at` (in the lab's timezone), if any. */
export function getCurrentSemester(timeZone: string, at = new Date(), client: Tx | typeof db = db) {
  const today = dateOnlyInTz(at, timeZone);
  return client.semester.findFirst({
    where: { startsOn: { lte: today }, endsOn: { gte: today } },
    orderBy: { startsOn: "desc" },
  });
}
