import type { ComputerState } from "./schemas";

// Pure computer-state rules, shared by the service and unit tests.

export type ComputerSnapshot = { id: string; number: number; state: ComputerState; inUse: boolean };

export type StatePlan = {
  apply: ComputerSnapshot[];
  skipped: { number: number; reason: string }[];
};

/**
 * Which of the selected computers can move to `target`:
 * - LOCKED is refused while someone is using the PC (from the original system: locking an
 *   occupied PC would strand the student). End their sit-in first.
 * - MAINTENANCE is allowed while in use: it's a flag for staff (e.g. the student reported a
 *   broken mouse) and stops new assignments, but doesn't interrupt the current session.
 * - Computers already in the target state are left alone.
 */
export function planStateChange(computers: ComputerSnapshot[], target: ComputerState): StatePlan {
  const plan: StatePlan = { apply: [], skipped: [] };
  for (const pc of computers) {
    if (pc.state === target) continue;
    if (target === "LOCKED" && pc.inUse) {
      plan.skipped.push({ number: pc.number, reason: "in use" });
      continue;
    }
    plan.apply.push(pc);
  }
  return plan;
}

/** Effective opening hours: the lab's own override, else the default from Settings. */
export function labHours(
  lab: { opensAt: number | null; closesAt: number | null },
  settings: { labOpensAt: number; labClosesAt: number },
) {
  return { opensAt: lab.opensAt ?? settings.labOpensAt, closesAt: lab.closesAt ?? settings.labClosesAt };
}

/** Numbers to remove when shrinking a lab: always the highest-numbered PCs, so numbering stays 1..N. */
export function computersToRemove(existingNumbers: number[], newCount: number): number[] {
  return existingNumbers.filter((n) => n > newCount).sort((a, b) => a - b);
}
