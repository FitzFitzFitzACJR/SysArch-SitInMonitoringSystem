import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { DomainError, NotFoundError } from "@/lib/errors";
import { uniqueViolation } from "@/lib/prisma-errors";
import { writeAudit } from "@/features/audit/service";
import { labWindow } from "@/features/labs/hours";
import { labHours } from "@/features/labs/rules";
import { notify } from "@/features/notifications/service";
import { adjustBalance, awardPoints } from "@/features/points/ledger";
import { getCurrentSemester } from "@/features/semesters/queries";
import { getSettings } from "@/features/settings/queries";
import { formatMinutes12h, minutesOfDayInTz } from "@/lib/time";
import { computeSitInWindow, shouldWarn } from "./rules";
import { QR_PREFIX, type StartSitInInput } from "./schemas";

type Actor = { id: string; ip: string | null };

// Friendly messages for the database's last line of defence (partial unique indexes).
const RACE_MESSAGES = {
  one_active_per_student: "This student already has an active sit-in.",
  one_active_per_computer: "Someone is already using that computer.",
};

// ---------------------------------------------------------------------------
// Lookup (QR scan or typed ID number)
// ---------------------------------------------------------------------------

export async function lookupStudent(query: string) {
  const byToken = query.startsWith(QR_PREFIX);
  const student = await db.user.findFirst({
    where: {
      role: "STUDENT",
      ...(byToken ? { qrToken: query.slice(QR_PREFIX.length) } : { idNumber: { equals: query, mode: "insensitive" } }),
    },
    select: {
      id: true,
      idNumber: true,
      firstName: true,
      lastName: true,
      photoUrl: true,
      status: true,
      yearLevel: true,
      remainingSessions: true,
      pointsBalance: true,
      course: { select: { code: true } },
      sitIns: {
        where: { status: "ACTIVE" },
        select: {
          id: true,
          startedAt: true,
          endsAt: true,
          purpose: true,
          lab: { select: { name: true } },
          computer: { select: { number: true } },
          language: { select: { name: true } },
        },
      },
    },
  });
  if (!student) {
    throw new DomainError(
      byToken
        ? "That QR code doesn't belong to any student. It may have been regenerated."
        : "No student with that ID number.",
    );
  }
  const { sitIns, ...rest } = student;
  return { ...rest, activeSitIn: sitIns[0] ?? null };
}

export type LookupResult = Awaited<ReturnType<typeof lookupStudent>>;

/** Computers a new sit-in can use right now: in service and nobody on them. */
export function availableComputers(labId: string) {
  return db.computer.findMany({
    where: { labId, state: "ACTIVE", sitIns: { none: { status: "ACTIVE" } } },
    orderBy: { number: "asc" },
    select: { id: true, number: true },
  });
}

// ---------------------------------------------------------------------------
// Start / end / cancel
// ---------------------------------------------------------------------------

export async function startSitIn(input: StartSitInInput, actor: Actor) {
  const settings = await getSettings();
  const now = new Date();

  try {
    return await db.$transaction(async (tx) => {
      const student = await tx.user.findFirst({ where: { id: input.studentId, role: "STUDENT" } });
      if (!student) throw new NotFoundError("Student");
      if (student.status !== "ACTIVE") throw new DomainError("This student's account isn't active.");
      if (student.remainingSessions <= 0) throw new DomainError("This student has no remaining sit-in sessions.");

      const active = await tx.sitIn.findFirst({ where: { studentId: student.id, status: "ACTIVE" } });
      if (active) throw new DomainError(RACE_MESSAGES.one_active_per_student);

      const lab = await tx.lab.findUnique({ where: { id: input.labId } });
      if (!lab || !lab.isActive) throw new DomainError("That lab isn't open for sit-ins.");

      const window = labWindow(lab, settings, now);
      const slot = computeSitInWindow(now, { maxMinutes: settings.maxSitInMinutes, ...window });
      if (!slot) {
        const hours = labHours(lab, settings);
        throw new DomainError(
          `${lab.name} is closed right now (open ${formatMinutes12h(hours.opensAt)}–${formatMinutes12h(hours.closesAt)}).`,
        );
      }

      const computer = await tx.computer.findFirst({
        where: { id: input.computerId, labId: lab.id },
        include: { sitIns: { where: { status: "ACTIVE" }, select: { id: true } } },
      });
      if (!computer) throw new DomainError("That computer isn't in this lab.");
      if (computer.state === "LOCKED") throw new DomainError(`PC ${computer.number} is locked.`);
      if (computer.state === "MAINTENANCE") throw new DomainError(`PC ${computer.number} is under maintenance.`);
      if (computer.sitIns.length) throw new DomainError(RACE_MESSAGES.one_active_per_computer);

      const language = await tx.language.findFirst({ where: { id: input.languageId, isActive: true } });
      if (!language) throw new DomainError("Select a valid programming language.");

      const semester = await getCurrentSemester(settings.timezone, now, tx);
      if (!semester) throw new DomainError("There's no active semester. A super admin needs to set one up.");

      const sitIn = await tx.sitIn.create({
        data: {
          studentId: student.id,
          labId: lab.id,
          computerId: computer.id,
          languageId: input.languageId,
          purpose: input.purpose,
          semesterId: semester.id,
          startedAt: now,
          endsAt: slot.endsAt,
          startedById: actor.id,
        },
      });

      // The session is used at check-in, as in the original system (refunded if cancelled).
      const after = await adjustBalance(tx, {
        userId: student.id,
        reason: "SIT_IN_START",
        sessionsDelta: -1,
        actorId: actor.id,
        sitInId: sitIn.id,
        semesterId: semester.id,
      });
      if (after.remainingSessions < 0) throw new DomainError("This student has no remaining sit-in sessions.");

      await notify(tx, student.id, {
        type: "SIT_IN",
        title: "Sit-in started",
        body: `${lab.name}, PC ${computer.number}. Ends at ${formatMinutes12h(minutesOfDayInTz(slot.endsAt, settings.timezone))}${slot.endsAtClosing ? " (closing time)" : ""}. ${after.remainingSessions} session(s) left.`,
        link: "/dashboard",
      });
      await writeAudit(tx, {
        actorId: actor.id,
        action: "sitIn.start",
        entityType: "SitIn",
        entityId: sitIn.id,
        details: { student: student.idNumber, lab: lab.code, pc: computer.number },
        ipAddress: actor.ip,
      });
      return sitIn;
    });
  } catch (e) {
    throw uniqueViolation(e, RACE_MESSAGES) ?? e;
  }
}

/**
 * Ends a sit-in. With `reward`, the student earns Settings.sitInRewardPoints, converted to
 * bonus sessions automatically. Either way the computer frees up, because "in use" is
 * derived from active sit-ins (the original's no-reward path left the PC stuck "occupied").
 */
export async function endSitIn(id: string, reward: boolean, actor: Actor) {
  const settings = await getSettings();
  return db.$transaction(async (tx) => {
    const now = new Date();
    // Conditional update: two staff pressing "End" at once can't both reward the student.
    const { count } = await tx.sitIn.updateMany({
      where: { id, status: "ACTIVE" },
      data: { status: "COMPLETED", endedAt: now, endReason: "STAFF", endedById: actor.id, rewarded: reward },
    });
    if (count === 0) throw new DomainError("That sit-in has already ended.");
    const sitIn = await tx.sitIn.findUniqueOrThrow({ where: { id }, include: { student: true, lab: true } });

    let bonusSessions = 0;
    if (reward && settings.sitInRewardPoints > 0) {
      bonusSessions = await awardPoints(
        tx,
        {
          userId: sitIn.studentId,
          reason: "SIT_IN_REWARD",
          pointsDelta: settings.sitInRewardPoints,
          actorId: actor.id,
          sitInId: id,
          semesterId: sitIn.semesterId,
        },
        settings.pointsPerSession,
      );
    }

    await notify(tx, sitIn.studentId, {
      type: "SIT_IN",
      title: "Sit-in ended",
      body:
        `Your sit-in in ${sitIn.lab.name} has ended.` +
        (reward ? ` You earned ${settings.sitInRewardPoints} point(s).` : "") +
        (bonusSessions ? ` That's a bonus session: +${bonusSessions}!` : ""),
      link: "/history",
    });
    await writeAudit(tx, {
      actorId: actor.id,
      action: reward ? "sitIn.end.reward" : "sitIn.end",
      entityType: "SitIn",
      entityId: id,
      details: {
        student: sitIn.student.idNumber,
        minutes: Math.round((now.getTime() - sitIn.startedAt.getTime()) / 60_000),
      },
      ipAddress: actor.ip,
    });
    return { bonusSessions };
  });
}

/** For sit-ins started by mistake: ends it and gives the session back, via the ledger. */
export async function cancelSitIn(id: string, reason: string, actor: Actor) {
  return db.$transaction(async (tx) => {
    const { count } = await tx.sitIn.updateMany({
      where: { id, status: "ACTIVE" },
      data: { status: "CANCELLED", endedAt: new Date(), endReason: "STAFF", endedById: actor.id },
    });
    if (count === 0) throw new DomainError("That sit-in has already ended.");
    const sitIn = await tx.sitIn.findUniqueOrThrow({ where: { id }, include: { student: true } });
    await adjustBalance(tx, {
      userId: sitIn.studentId,
      reason: "SIT_IN_REFUND",
      sessionsDelta: 1,
      note: reason,
      actorId: actor.id,
      sitInId: id,
      semesterId: sitIn.semesterId,
    });
    await notify(tx, sitIn.studentId, {
      type: "SIT_IN",
      title: "Sit-in cancelled",
      body: `Your sit-in was cancelled and the session refunded. Reason: ${reason}`,
      link: "/history",
    });
    await writeAudit(tx, {
      actorId: actor.id,
      action: "sitIn.cancel",
      entityType: "SitIn",
      entityId: id,
      details: { student: sitIn.student.idNumber, reason },
      ipAddress: actor.ip,
    });
  });
}

// ---------------------------------------------------------------------------
// Time limits: warnings and auto-ending (run by cron, and lazily on page loads)
// ---------------------------------------------------------------------------

/**
 * Warns students whose time is nearly up, and ends sit-ins past their limit (including
 * ones forgotten at closing time). Safe to run any number of times, concurrently: each
 * change is a conditional update, so nothing is warned or ended twice.
 */
export async function sweepSitIns(now = new Date()) {
  const settings = await getSettings();
  const warnHorizon = new Date(now.getTime() + settings.warnBeforeMinutes * 60_000);
  const due = await db.sitIn.findMany({
    where: { status: "ACTIVE", OR: [{ endsAt: { lte: now } }, { warnedAt: null, endsAt: { lte: warnHorizon } }] },
    include: { lab: true },
  });

  let warned = 0;
  let ended = 0;
  for (const sitIn of due) {
    if (sitIn.endsAt <= now) {
      const closing = labWindow(sitIn.lab, settings, sitIn.endsAt).closesAt;
      const reason = sitIn.endsAt.getTime() >= closing.getTime() ? "LAB_CLOSING" : "TIME_LIMIT";
      await db.$transaction(async (tx) => {
        const { count } = await tx.sitIn.updateMany({
          where: { id: sitIn.id, status: "ACTIVE" },
          data: { status: "COMPLETED", endedAt: sitIn.endsAt, endReason: reason },
        });
        if (count === 0) return;
        ended++;
        await notify(tx, sitIn.studentId, {
          type: "SIT_IN",
          title: "Sit-in ended automatically",
          body:
            reason === "LAB_CLOSING"
              ? `${sitIn.lab.name} closed, so your sit-in was ended.`
              : "Your sit-in reached its time limit and was ended.",
          link: "/history",
        });
      });
    } else if (shouldWarn(sitIn, now, settings.warnBeforeMinutes)) {
      await db.$transaction(async (tx) => {
        const { count } = await tx.sitIn.updateMany({
          where: { id: sitIn.id, warnedAt: null },
          data: { warnedAt: now },
        });
        if (count === 0) return;
        warned++;
        await notify(tx, sitIn.studentId, {
          type: "SIT_IN",
          title: "Your time is almost up",
          body: `Your sit-in in ${sitIn.lab.name} ends at ${formatMinutes12h(minutesOfDayInTz(sitIn.endsAt, settings.timezone))}. Please save your work.`,
          link: "/dashboard",
        });
      });
    }
  }
  return { warned, ended };
}

// Pages call this so overdue sit-ins are closed even if the cron job hasn't run (e.g. on
// Vercel's free plan). Throttled per server instance so busy pages don't sweep every time.
let lastSweep = 0;
export async function sweepIfStale(minIntervalMs = 30_000) {
  if (Date.now() - lastSweep < minIntervalMs) return;
  lastSweep = Date.now();
  await sweepSitIns();
}

// ---------------------------------------------------------------------------
// QR codes
// ---------------------------------------------------------------------------

/** Issues a new QR token; the old code stops working immediately (e.g. if a screenshot leaked). */
export async function rotateQrToken(userId: string) {
  await db.user.update({ where: { id: userId }, data: { qrToken: randomBytes(18).toString("base64url") } });
}
