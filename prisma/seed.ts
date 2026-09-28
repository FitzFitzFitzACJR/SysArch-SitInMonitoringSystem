/**
 * Idempotent seed: safe to run repeatedly. Reference data is upserted; accounts are only
 * created if missing (existing passwords are never overwritten).
 *
 *   npx prisma db seed
 */
import "dotenv/config";
import { createPrismaClient } from "../src/lib/prisma-client";
import { hashPassword } from "../src/lib/password";

const db = createPrismaClient();

const LABS = ["524", "526", "528", "530", "547", "MAC"];
const COMPUTERS_PER_LAB = 50; // matches the original system

const COURSES = [
  { code: "BSIT", name: "Bachelor of Science in Information Technology" },
  { code: "BSCS", name: "Bachelor of Science in Computer Science" },
  { code: "BSA", name: "Bachelor of Science in Accountancy" },
  { code: "BSCRIM", name: "Bachelor of Science in Criminology" },
];

const LANGUAGES = ["C#", "C", "Java", "ASP.Net", "PHP", "Other"];

// The original's reservation slots: 90 minutes, 8:00–17:30, lunch break 12:30–13:00.
const TIME_SLOTS: [number, number][] = [
  [8 * 60, 9 * 60 + 30],
  [9 * 60 + 30, 11 * 60],
  [11 * 60, 12 * 60 + 30],
  [13 * 60, 14 * 60 + 30],
  [14 * 60 + 30, 16 * 60],
  [16 * 60, 17 * 60 + 30],
];

const DEFAULT_RULES = `1. Present your QR code or ID to the lab staff to check in and out.
2. Use only the computer you were assigned.
3. No food or drinks near the computers.
4. Do not install software or change system settings.
5. Report any problem with your computer using "Report an issue".
6. Log out of all accounts before you leave.`;

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be set (see .env.example)`);
  return value;
}

function label12h(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = String(minutes % 60).padStart(2, "0");
  return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h < 12 ? "AM" : "PM"}`;
}

/** Philippine academic calendar: 1st sem Aug–Dec, 2nd sem Jan–May, midyear Jun–Jul. */
function semesterFor(date: Date) {
  const y = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  if (month >= 8) return { name: `1st Semester AY ${y}–${y + 1}`, startsOn: `${y}-08-01`, endsOn: `${y}-12-31` };
  if (month <= 5) return { name: `2nd Semester AY ${y - 1}–${y}`, startsOn: `${y}-01-01`, endsOn: `${y}-05-31` };
  return { name: `Midyear AY ${y - 1}–${y}`, startsOn: `${y}-06-01`, endsOn: `${y}-07-31` };
}

async function main() {
  const settings = await db.settings.upsert({
    where: { id: 1 },
    create: { id: 1, rulesText: DEFAULT_RULES },
    update: {},
  });

  for (const course of COURSES) {
    await db.course.upsert({ where: { code: course.code }, create: course, update: {} });
  }

  for (const [i, name] of LANGUAGES.entries()) {
    await db.language.upsert({ where: { name }, create: { name, sortOrder: i }, update: {} });
  }

  for (const [i, [startMinute, endMinute]] of TIME_SLOTS.entries()) {
    await db.timeSlot.upsert({
      where: { startMinute_endMinute: { startMinute, endMinute } },
      create: { startMinute, endMinute, sortOrder: i, label: `${label12h(startMinute)} – ${label12h(endMinute)}` },
      update: {},
    });
  }

  for (const [i, code] of LABS.entries()) {
    const lab = await db.lab.upsert({
      where: { code },
      create: { code, name: code === "MAC" ? "MAC Laboratory" : `Lab ${code}`, sortOrder: i },
      update: {},
    });
    await db.computer.createMany({
      data: Array.from({ length: COMPUTERS_PER_LAB }, (_, n) => ({ labId: lab.id, number: n + 1 })),
      skipDuplicates: true,
    });
  }

  const term = semesterFor(new Date());
  const semester = await db.semester.upsert({
    where: { name: term.name },
    create: {
      name: term.name,
      startsOn: new Date(`${term.startsOn}T00:00:00Z`),
      endsOn: new Date(`${term.endsOn}T00:00:00Z`),
      sessionAllotment: settings.defaultSessions,
      // Accounts below get their allotment directly, so the start-of-semester job has nothing to do.
      resetAppliedAt: new Date(),
    },
    update: {},
  });

  // --- Accounts -------------------------------------------------------------
  await ensureUser({
    idNumber: required("SEED_ADMIN_ID_NUMBER"),
    email: required("SEED_ADMIN_EMAIL"),
    password: required("SEED_ADMIN_PASSWORD"),
    firstName: "System",
    lastName: "Administrator",
    role: "SUPER_ADMIN",
    mustChangePassword: true, // the env password is only a bootstrap secret
  });

  if (process.env.SEED_DEMO === "true") {
    const password = required("SEED_DEMO_PASSWORD");
    await ensureUser({
      idNumber: "staff",
      email: "staff@ccs.local",
      password,
      firstName: "Lab",
      lastName: "Staff",
      role: "LAB_STAFF",
    });

    const courses = await db.course.findMany();
    const demoStudents = [
      ["Carlos", "Garcia"],
      ["Maria", "Santos"],
      ["Juan", "Dela Cruz"],
      ["Ana", "Reyes"],
      ["Miguel", "Bautista"],
    ];
    for (const [i, [firstName, lastName]] of demoStudents.entries()) {
      await ensureUser({
        idNumber: `2024-000${i + 1}`,
        email: `student${i + 1}@ccs.local`,
        password,
        firstName,
        lastName,
        role: "STUDENT",
        courseId: courses[i % courses.length].id,
        yearLevel: (i % 4) + 1,
        sessions: semester.sessionAllotment,
        semesterId: semester.id,
      });
    }
  }

  const counts = {
    labs: await db.lab.count(),
    computers: await db.computer.count(),
    users: await db.user.count(),
  };
  console.log(
    `✔ Seeded: ${counts.labs} labs, ${counts.computers} computers, ${counts.users} users, semester "${semester.name}"`,
  );
}

async function ensureUser(u: {
  idNumber: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "STUDENT" | "LAB_STAFF" | "SUPER_ADMIN";
  mustChangePassword?: boolean;
  courseId?: string;
  yearLevel?: number;
  sessions?: number;
  semesterId?: string;
}) {
  const existing = await db.user.findUnique({ where: { idNumber: u.idNumber } });
  if (existing) return existing;

  const sessions = u.sessions ?? 0;
  return db.user.create({
    data: {
      idNumber: u.idNumber,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      passwordHash: await hashPassword(u.password),
      mustChangePassword: u.mustChangePassword ?? false,
      courseId: u.courseId,
      yearLevel: u.yearLevel,
      remainingSessions: sessions,
      // Keep the running total and the ledger in agreement from day one.
      pointsLog: sessions
        ? {
            create: {
              sessionsDelta: sessions,
              reason: "SEMESTER_RESET",
              note: "Initial session allotment",
              semesterId: u.semesterId,
            },
          }
        : undefined,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
