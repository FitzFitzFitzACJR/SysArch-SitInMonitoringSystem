// Pure sit-in rules (no database), shared by the service and unit tests.

/**
 * When a new sit-in must end: after the maximum duration, or at closing time, whichever
 * comes first. Returns null if the lab is already closed (or not yet open).
 */
export function computeSitInWindow(
  now: Date,
  opts: { maxMinutes: number; opensAt: Date; closesAt: Date },
): { endsAt: Date; endsAtClosing: boolean } | null {
  if (now < opts.opensAt || now >= opts.closesAt) return null;
  const byLimit = new Date(now.getTime() + opts.maxMinutes * 60_000);
  return byLimit < opts.closesAt
    ? { endsAt: byLimit, endsAtClosing: false }
    : { endsAt: opts.closesAt, endsAtClosing: true };
}

/**
 * Converts accumulated points into bonus sessions at `pointsPerSession`. Leftover points
 * carry over (the original rounded down per award, so 1+1+1 points never became a session).
 * A negative balance (penalties) converts nothing.
 */
export function pointsToSessions(balance: number, pointsPerSession: number) {
  if (pointsPerSession <= 0 || balance < pointsPerSession) return { sessions: 0, pointsUsed: 0 };
  const sessions = Math.floor(balance / pointsPerSession);
  return { sessions, pointsUsed: sessions * pointsPerSession };
}

/** Whether a still-active sit-in should get its "time is almost up" warning now. */
export function shouldWarn(sitIn: { endsAt: Date; warnedAt: Date | null }, now: Date, warnBeforeMinutes: number) {
  return (
    !sitIn.warnedAt && warnBeforeMinutes > 0 && sitIn.endsAt.getTime() - now.getTime() <= warnBeforeMinutes * 60_000
  );
}

/** Minutes left, rounded up, never negative. */
export function minutesLeft(endsAt: Date, now: Date) {
  return Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / 60_000));
}
