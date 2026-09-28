import "server-only";
import { db } from "@/lib/db";

export function listActiveSitIns(labId?: string) {
  return db.sitIn.findMany({
    where: { status: "ACTIVE", ...(labId && { labId }) },
    orderBy: { endsAt: "asc" }, // soonest to finish first
    select: {
      id: true,
      startedAt: true,
      endsAt: true,
      purpose: true,
      student: { select: { id: true, idNumber: true, firstName: true, lastName: true, photoUrl: true } },
      lab: { select: { id: true, name: true } },
      computer: { select: { number: true } },
      language: { select: { name: true } },
    },
  });
}

export type ActiveSitInRow = Awaited<ReturnType<typeof listActiveSitIns>>[number];

export function listFinishedSince(since: Date) {
  return db.sitIn.findMany({
    where: { status: { not: "ACTIVE" }, endedAt: { gte: since } },
    orderBy: { endedAt: "desc" },
    take: 50,
    select: {
      id: true,
      status: true,
      startedAt: true,
      endedAt: true,
      endReason: true,
      rewarded: true,
      student: { select: { id: true, idNumber: true, firstName: true, lastName: true } },
      lab: { select: { name: true } },
      computer: { select: { number: true } },
      language: { select: { name: true } },
      endedBy: { select: { firstName: true, lastName: true } },
    },
  });
}

export const HISTORY_PAGE_SIZE = 20;

export async function listStudentSitIns(studentId: string, page: number) {
  const where = { studentId };
  const [rows, total] = await Promise.all([
    db.sitIn.findMany({
      where,
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * HISTORY_PAGE_SIZE,
      take: HISTORY_PAGE_SIZE,
      select: {
        id: true,
        status: true,
        startedAt: true,
        endedAt: true,
        endsAt: true,
        endReason: true,
        rewarded: true,
        purpose: true,
        lab: { select: { name: true } },
        computer: { select: { number: true } },
        language: { select: { name: true } },
      },
    }),
    db.sitIn.count({ where }),
  ]);
  return { rows, total, pageCount: Math.max(1, Math.ceil(total / HISTORY_PAGE_SIZE)) };
}

export function getActiveSitInFor(studentId: string) {
  return db.sitIn.findFirst({
    where: { studentId, status: "ACTIVE" },
    select: {
      id: true,
      startedAt: true,
      endsAt: true,
      lab: { select: { name: true } },
      computer: { select: { number: true } },
      language: { select: { name: true } },
    },
  });
}

export function listSitInOptions() {
  return Promise.all([
    db.lab.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.language.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]).then(([labs, languages]) => ({ labs, languages }));
}
