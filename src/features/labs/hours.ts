import "server-only";
import { dateOnlyInTz, localTimeToInstant } from "@/lib/time";
import { labHours } from "./rules";

/** Today's opening and closing instants for a lab, in the lab's timezone. */
export function labWindow(
  lab: { opensAt: number | null; closesAt: number | null },
  settings: { labOpensAt: number; labClosesAt: number; timezone: string },
  now = new Date(),
) {
  const day = dateOnlyInTz(now, settings.timezone);
  const hours = labHours(lab, settings);
  return {
    day,
    opensAt: localTimeToInstant(day, hours.opensAt, settings.timezone),
    closesAt: localTimeToInstant(day, hours.closesAt, settings.timezone),
  };
}
