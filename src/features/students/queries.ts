import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { StudentListQuery } from "./schemas";

export const STUDENTS_PAGE_SIZE = 20;

export async function listStudents(query: StudentListQuery) {
  const q = query.q?.trim();
  const where: Prisma.UserWhereInput = {
    role: "STUDENT",
    ...(query.status !== "ALL" && { status: query.status }),
    ...(query.courseId && { courseId: query.courseId }),
    ...(query.yearLevel && { yearLevel: query.yearLevel }),
    ...(q && {
      OR: [
        { idNumber: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    }),
  };

  const [rows, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      skip: (query.page - 1) * STUDENTS_PAGE_SIZE,
      take: STUDENTS_PAGE_SIZE,
      select: {
        id: true,
        idNumber: true,
        firstName: true,
        middleName: true,
        lastName: true,
        email: true,
        yearLevel: true,
        status: true,
        photoUrl: true,
        remainingSessions: true,
        pointsBalance: true,
        course: { select: { code: true } },
      },
    }),
    db.user.count({ where }),
  ]);
  return { rows, total, pageCount: Math.max(1, Math.ceil(total / STUDENTS_PAGE_SIZE)) };
}

export type StudentRow = Awaited<ReturnType<typeof listStudents>>["rows"][number];

export async function getStudentDetail(id: string) {
  const student = await db.user.findFirst({
    where: { id, role: "STUDENT" },
    select: {
      id: true,
      idNumber: true,
      firstName: true,
      middleName: true,
      lastName: true,
      email: true,
      courseId: true,
      yearLevel: true,
      status: true,
      photoUrl: true,
      remainingSessions: true,
      pointsBalance: true,
      lifetimePoints: true,
      lastLoginAt: true,
      createdAt: true,
      passwordHash: true,
      course: { select: { code: true, name: true } },
      pointsLog: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          createdAt: true,
          reason: true,
          note: true,
          sessionsDelta: true,
          pointsDelta: true,
          actor: { select: { firstName: true, lastName: true } },
        },
      },
      _count: { select: { sitIns: true, reservations: true } },
    },
  });
  if (!student) return null;
  // Never let the hash leave this function; callers only need to know whether one is set.
  const { passwordHash, ...rest } = student;
  return { ...rest, passwordPending: passwordHash.startsWith("!") };
}

export function listActiveCourses() {
  return db.course.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });
}
