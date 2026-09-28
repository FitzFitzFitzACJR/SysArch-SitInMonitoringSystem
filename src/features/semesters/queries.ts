import "server-only";
import type { Tx } from "@/lib/db";
import { db } from "@/lib/db";
import { dateOnlyInTz } from "@/lib/time";
import { getSettings } from "@/features/settings/queries";

/** The semester whose date range contains `at` (in the lab's timezone), if any. */
export function getCurrentSemester(timeZone: string, at = new Date(), client: Tx | typeof db = db) {
  const today = dateOnlyInTz(at, timeZone);
  return client.semester.findFirst({
    where: { startsOn: { lte: today }, endsOn: { gte: today } },
    orderBy: { startsOn: "desc" },
  });
}

/** How many sessions a student gets right now: the current semester's allotment, else the default. */
export async function getSessionAllotment(client: Tx | typeof db = db) {
  const settings = await getSettings();
  const semester = await getCurrentSemester(settings.timezone, new Date(), client);
  return { sessions: semester?.sessionAllotment ?? settings.defaultSessions, semesterId: semester?.id ?? null };
}

/** The semester containing a calendar date (UTC-midnight, as stored in @db.Date columns). */
export function getSemesterForDate(date: Date, client: Tx | typeof db = db) {
  return client.semester.findFirst({
    where: { startsOn: { lte: date }, endsOn: { gte: date } },
    orderBy: { startsOn: "desc" },
  });
}
