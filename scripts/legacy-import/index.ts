/**
 * One-off import of the original PHP system's data (a sysarch.sql MySQL dump).
 *
 *   npm run legacy:import -- --file ../sysarch/sysarch.sql --dry-run
 *   npm run legacy:import -- --file ../sysarch/sysarch.sql --uploads ../sysarch/uploads
 *
 * Options
 *   --file <path>       the dump (required)
 *   --dry-run           do everything inside a transaction, print the report, roll back
 *   --uploads <dir>     the old uploads/ folder, to bring profile photos across
 *   --default-lab <code> lab for old rows with no room recorded (otherwise they're skipped)
 *   --mysql-tz <zone>   zone of MySQL-written timestamps (default Asia/Manila)
 *   --php-tz <zone>     zone of PHP date() timestamps, e.g. session_end (default Europe/Berlin,
 *                       XAMPP's php.ini default — the cause of the original's negative durations)
 *
 * Everything happens in one transaction: it either all imports or nothing does.
 */
import "dotenv/config";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import type { Prisma } from "../../src/generated/prisma/client";
import { createPrismaClient } from "../../src/lib/prisma-client";
import { hashPassword } from "../../src/lib/password";
import { dateOnlyInTz, localTimeToInstant } from "../../src/lib/time";
import { labHours } from "../../src/features/labs/rules";
import { academicTermFor } from "../../src/features/semesters/calendar";
import {
  LEGACY_COURSES,
  clampYearLevel,
  courseCode,
  dayOfWeek,
  feedbackCategory,
  isBcrypt,
  labCode,
  languageName,
  legacyInstant,
  parseTimeRange,
  reservationLanguage,
  sitInTimes,
} from "./mapping";
import { parseInserts, type Row } from "./parse-sql";

type Tx = Prisma.TransactionClient;

// --- CLI ---------------------------------------------------------------------------

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const file = arg("file");
const dryRun = process.argv.includes("--dry-run");
const uploadsDir = arg("uploads");
const defaultLab = arg("default-lab")?.toUpperCase();
const zones = { mysql: arg("mysql-tz") ?? "Asia/Manila", php: arg("php-tz") ?? "Europe/Berlin" };
if (!file) {
  console.error("Usage: npm run legacy:import -- --file path/to/sysarch.sql [--dry-run] [--uploads dir]");
  process.exit(1);
}

// --- Report ------------------------------------------------------------------------

const counts: Record<string, { imported: number; skipped: number }> = {};
const warnings: string[] = [];
const count = (table: string, ok: boolean) => {
  counts[table] ??= { imported: 0, skipped: 0 };
  counts[table][ok ? "imported" : "skipped"]++;
};
const warn = (msg: string) => warnings.push(msg);

class DryRunRollback extends Error {}

// --- Import ------------------------------------------------------------------------

const db = createPrismaClient();

async function main() {
  const tables = parseInserts(readFileSync(file!, "utf8"));
  const rows = (t: string): Row[] => tables.get(t) ?? [];
  console.log(`Read ${file}: ${[...tables].map(([t, r]) => `${t} (${r.length})`).join(", ")}\n`);

  if (await db.pointsLog.findFirst({ where: { reason: "LEGACY_IMPORT" } })) {
    throw new Error("Legacy data has already been imported into this database. Refusing to import twice.");
  }

  const photosToWrite: { key: string; data: Buffer }[] = [];

  try {
    await db.$transaction(
      async (tx) => {
        const settings = await tx.settings.findUniqueOrThrow({ where: { id: 1 } });
        const ctx = await buildContext(tx);

        // Users first: everything else points at them. Old tables reference `idno`.
        const userIdByIdno = new Map<string, string>();
        const createdIds = new Set<string>(); // balances are only rebuilt for accounts we created
        for (const u of rows("users")) {
          const result = await importUser(tx, u, ctx, photosToWrite);
          if (result) {
            userIdByIdno.set(String(u.idno), result.id);
            if (result.created) createdIds.add(result.id);
          }
        }
        // Records need someone as "started by"/"author": the imported admin, else any super admin.
        const fallbackStaff =
          userIdByIdno.get("00") ??
          (await tx.user.findFirst({ where: { role: "SUPER_ADMIN" }, select: { id: true } }))?.id;
        if (!fallbackStaff) throw new Error("No super admin to attribute imported records to. Run the seed first.");

        const semesterFor = (instant: Date) => semesterId(tx, dateOnlyInTz(instant, settings.timezone), ctx);

        // Points history: old rows as history, then an opening balance so the ledger
        // total equals the imported balance (the invariant the whole app relies on).
        const legacyPoints = rows("points_log");
        for (const u of rows("users")) {
          const userId = userIdByIdno.get(String(u.idno));
          if (!userId || !createdIds.has(userId) || String(u.idno) === "00") continue;
          let sessionsSoFar = 0;
          let pointsSoFar = 0;
          for (const p of legacyPoints.filter((p) => String(p.student_id) === String(u.idno))) {
            const at = legacyInstant(p.added_on, zones.mysql) ?? new Date();
            await tx.pointsLog.create({
              data: {
                userId,
                reason: "LEGACY_IMPORT",
                pointsDelta: Number(p.points_added ?? 0),
                sessionsDelta: Number(p.sessions_added ?? 0),
                note: `Old system: ${p.reason ?? ""}`.trim(),
                actorId: userIdByIdno.get(String(p.added_by)) ?? null,
                semesterId: await semesterFor(at),
                createdAt: at,
              },
            });
            pointsSoFar += Number(p.points_added ?? 0);
            sessionsSoFar += Number(p.sessions_added ?? 0);
            count("points_log", true);
          }
          const sessions = Number(u.remaining_sessions ?? settings.defaultSessions);
          const points = Number(u.behavior_points ?? 0);
          await tx.pointsLog.create({
            data: {
              userId,
              reason: "LEGACY_IMPORT",
              sessionsDelta: sessions - sessionsSoFar,
              pointsDelta: points - pointsSoFar,
              note: "Opening balance from the old system",
            },
          });
          await tx.user.update({
            where: { id: userId },
            data: { remainingSessions: sessions, pointsBalance: points, lifetimePoints: Math.max(points, pointsSoFar) },
          });
        }

        // Sit-ins.
        for (const s of rows("sit_in_sessions")) {
          const studentId = userIdByIdno.get(String(s.student_id));
          const lab = ctx.labs.get(labCode(s.laboratory) ?? "");
          const times = sitInTimes({ session_start: s.session_start, session_end: s.session_end }, zones);
          if (!studentId || !lab || !times) {
            warn(
              `sit_in_sessions #${s.id}: skipped (${!studentId ? "unknown student" : !lab ? `unknown lab "${s.laboratory}"` : "no start time"})`,
            );
            count("sit_in_sessions", false);
            continue;
          }
          if (times.clamped)
            warn(`sit_in_sessions #${s.id}: end before start even after timezone correction; set to zero length`);

          // When the new system would have ended it: the time limit or closing time that day.
          const day = dateOnlyInTz(times.start, settings.timezone);
          const closing = localTimeToInstant(day, labHours(lab, settings).closesAt, settings.timezone);
          const byLimit = new Date(times.start.getTime() + settings.maxSitInMinutes * 60_000);
          const autoEnd = byLimit < closing || closing <= times.start ? byLimit : closing;
          const autoReason = autoEnd === byLimit ? "TIME_LIMIT" : "LAB_CLOSING";

          let end = times.end;
          let endReason: "STAFF" | "TIME_LIMIT" | "LAB_CLOSING" = "STAFF";
          if (!end || s.status === "active") {
            // Left open in the old system (e.g. #3, "active" since May 2025).
            [end, endReason] = [autoEnd, autoReason];
            warn(
              `sit_in_sessions #${s.id}: was still "active"; closed automatically (${autoReason.toLowerCase().replace("_", " ")})`,
            );
          } else if (end.getTime() > autoEnd.getTime() + 60 * 60_000) {
            // Forgotten and ended much later (e.g. #1 ran 9 days); cap it so durations and
            // utilisation stats stay meaningful. The original end is kept in the report.
            const hours = Math.round((end.getTime() - times.start.getTime()) / 3_600_000);
            warn(
              `sit_in_sessions #${s.id}: ran ${hours} h (ended ${end.toISOString()}); capped at the ${autoReason.toLowerCase().replace("_", " ")}`,
            );
            [end, endReason] = [autoEnd, autoReason];
          }

          const language = languageName(s.purpose);
          const computer = s.computer_id ? lab.computers.get(Number(s.computer_id)) : undefined;
          if (s.computer_id && !computer)
            warn(`sit_in_sessions #${s.id}: PC ${s.computer_id} not in ${lab.name}; imported without a PC`);
          // Rewarded if the old system logged a "completed" point within 2 min of the *original* end.
          const rewarded = legacyPoints.some(
            (p) =>
              String(p.student_id) === String(s.student_id) &&
              /completed sit-in/i.test(String(p.reason)) &&
              Math.abs((legacyInstant(p.added_on, zones.mysql)?.getTime() ?? 0) - (times.end ?? end!).getTime()) <
                120_000,
          );

          await tx.sitIn.create({
            data: {
              studentId,
              labId: lab.id,
              computerId: computer ?? null,
              languageId: ctx.languages.get(language ?? "Other")!,
              purpose: language ? null : String(s.purpose ?? "") || null,
              semesterId: await semesterFor(times.start),
              status: s.status === "cancelled" ? "CANCELLED" : "COMPLETED",
              startedAt: times.start,
              endsAt: end,
              endedAt: end,
              endReason,
              rewarded,
              startedById: fallbackStaff,
            },
          });
          count("sit_in_sessions", true);
        }
        if (rows("sit_in_records").length)
          warn("sit_in_records: duplicate of sit_in_sessions in the old system; ignored");

        // Reservations.
        const now = new Date();
        for (const r of rows("reservations")) {
          const studentId = userIdByIdno.get(String(r.student_id));
          const lab = ctx.labs.get(labCode(r.room) ?? defaultLab ?? "");
          if (!labCode(r.room) && lab)
            warn(`reservations #${r.id}: no lab recorded; filed under ${lab.name} (--default-lab)`);
          const range = parseTimeRange(r.time_slot);
          if (!studentId || !lab || !range || !r.date) {
            warn(
              `reservations #${r.id}: skipped (${!studentId ? "unknown student" : !lab ? "no lab recorded" : "unreadable date/time slot"})`,
            );
            count("reservations", false);
            continue;
          }
          const { language, purpose, swapped } = reservationLanguage({
            purpose: r.purpose,
            programming_language: r.programming_language,
          });
          if (swapped) warn(`reservations #${r.id}: language was stored as the purpose; swapped back`);
          const date = new Date(`${r.date}T00:00:00Z`);
          const start = localTimeToInstant(date, range.startMinute, settings.timezone);
          // Past bookings can't be left live, or the new no-show job would penalise them.
          let status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "FULFILLED" =
            r.status === "approved" ? "APPROVED" : r.status === "rejected" ? "REJECTED" : "PENDING";
          let note: string | null = null;
          if (start < now && status === "PENDING") [status, note] = ["CANCELLED", "Expired (imported)"];
          if (start < now && status === "APPROVED")
            [status, note] = ["FULFILLED", "Imported from the old system (attendance not recorded)"];

          await tx.reservation.create({
            data: {
              studentId,
              labId: lab.id,
              computerId: r.computer ? (lab.computers.get(Number(r.computer)) ?? null) : null,
              timeSlotId: await timeSlotId(tx, range, ctx),
              date,
              languageId: ctx.languages.get(language)!,
              purpose,
              semesterId: await semesterFor(start),
              status,
              decisionNote: note,
              createdAt: legacyInstant(r.created_at, zones.mysql) ?? now,
            },
          });
          count("reservations", true);
        }

        // Announcements (inactive ones are archived, not lost).
        for (const a of rows("announcements")) {
          const posted = legacyInstant(a.date_posted, zones.mysql) ?? now;
          await tx.announcement.create({
            data: {
              title: String(a.title ?? "(untitled)").slice(0, 150),
              body: String(a.content ?? "").trim() || "(empty)",
              authorId: userIdByIdno.get(String(a.posted_by ?? a.created_by)) ?? fallbackStaff,
              publishAt: posted,
              createdAt: posted,
              archivedAt: a.status === "inactive" ? posted : null,
            },
          });
          count("announcements", true);
        }

        // Feedback: both old tables had the same purpose.
        for (const f of [...rows("student_feedback"), ...rows("feedback")]) {
          const studentId = userIdByIdno.get(String(f.student_id));
          const lab = ctx.labs.get(labCode(f.room) ?? "");
          const rating = Number(f.rating);
          if (!studentId || !lab || !(rating >= 1 && rating <= 5)) {
            warn(
              `feedback #${f.id}: skipped (${!studentId ? "unknown student" : !lab ? "unknown lab" : "invalid rating"})`,
            );
            count("feedback", false);
            continue;
          }
          const at = legacyInstant(f.date_submitted ?? f.created_at ?? f.submitted_at, zones.mysql) ?? now;
          await tx.feedback.create({
            data: {
              studentId,
              labId: lab.id,
              rating,
              category: feedbackCategory(f.feedback_type),
              comments: String(f.comments ?? f.feedback_text ?? "").trim() || "(no comment)",
              suggestions: f.suggestions ? String(f.suggestions) : null,
              readAt: f.status === "read" ? at : null,
              createdAt: at,
            },
          });
          count("feedback", true);
        }

        // Resources: links come across; old local files only if they're an allowed type.
        for (const r of rows("lab_resources")) {
          const link = String(r.link ?? "");
          if (!/^https?:\/\//i.test(link)) {
            warn(
              `lab_resources #${r.id} "${r.title}": points at a local file (${link}); re-upload it in the new system`,
            );
            count("lab_resources", false);
            continue;
          }
          if (/localhost|127\.0\.0\.1/i.test(link))
            warn(`lab_resources #${r.id} "${r.title}": links to localhost; imported hidden`);
          await tx.resource.create({
            data: {
              title: String(r.title ?? "(untitled)").slice(0, 150),
              description: r.description ? String(r.description).trim() : null,
              url: link,
              isActive: r.status !== "inactive" && !/localhost|127\.0\.0\.1/i.test(link),
              createdById: fallbackStaff,
              createdAt: legacyInstant(r.created_at, zones.mysql) ?? now,
            },
          });
          count("lab_resources", true);
        }

        // Class schedules belong to the semester they were entered in.
        for (const s of rows("lab_schedules")) {
          const lab = ctx.labs.get(labCode(s.room) ?? "");
          const range = parseTimeRange(s.time_slot);
          const dow = dayOfWeek(s.day_of_week);
          if (!lab || !range || dow === null) {
            warn(`lab_schedules #${s.id}: skipped (unreadable lab, day or time)`);
            count("lab_schedules", false);
            continue;
          }
          await tx.labSchedule.create({
            data: {
              labId: lab.id,
              semesterId: await semesterFor(legacyInstant(s.created_at, zones.mysql) ?? now),
              dayOfWeek: dow,
              ...range,
              courseCode:
                String(s.course_code ?? "")
                  .toUpperCase()
                  .slice(0, 30) || "(unknown)",
              instructor: String(s.instructor ?? "").trim() || "(unknown)",
            },
          });
          count("lab_schedules", true);
        }

        for (const t of ["notifications", "attendance_leaderboard", "admin_logs", "resources"]) {
          if (rows(t).length)
            warn(
              `${t}: not imported (${t === "attendance_leaderboard" ? "the leaderboard is now calculated from sit-ins" : "transient or unused in the old system"})`,
            );
        }

        if (dryRun) throw new DryRunRollback();
      },
      { timeout: 120_000 },
    );
  } catch (e) {
    if (!(e instanceof DryRunRollback)) throw e;
  }

  // Files are written only after the database commit succeeded.
  if (!dryRun) {
    for (const p of photosToWrite) {
      const target = path.join(process.cwd(), "uploads", p.key);
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, p.data);
    }
  }

  printReport();
}

// --- Helpers -------------------------------------------------------------------------

type Ctx = Awaited<ReturnType<typeof buildContext>>;

async function buildContext(tx: Tx) {
  // Courses from the old numbering must exist (the seed creates the same four).
  for (const c of Object.values(LEGACY_COURSES)) {
    await tx.course.upsert({ where: { code: c.code }, create: c, update: {} });
  }
  const [courses, languages, labs, slots, semesters] = await Promise.all([
    tx.course.findMany(),
    tx.language.findMany(),
    tx.lab.findMany({ include: { computers: { select: { id: true, number: true } } } }),
    tx.timeSlot.findMany(),
    tx.semester.findMany(),
  ]);
  if (!languages.some((l) => l.name === "Other")) throw new Error('Language "Other" is missing. Run the seed first.');
  if (defaultLab && !labs.some((l) => l.code.toUpperCase() === defaultLab)) {
    throw new Error(`--default-lab: no lab with code "${defaultLab}"`);
  }
  return {
    courses: new Map(courses.map((c) => [c.code, c.id])),
    languages: new Map(languages.map((l) => [l.name, l.id])),
    labs: new Map(
      labs.map((l) => [l.code.toUpperCase(), { ...l, computers: new Map(l.computers.map((c) => [c.number, c.id])) }]),
    ),
    slots,
    semesters,
  };
}

async function importUser(tx: Tx, u: Row, ctx: Ctx, photos: { key: string; data: Buffer }[]) {
  const idNumber = String(u.idno ?? "").trim();
  if (!idNumber) {
    warn(`users #${u.id}: skipped (no ID number)`);
    count("users", false);
    return null;
  }
  const email =
    String(u.email ?? "")
      .trim()
      .toLowerCase() || `${idNumber}@legacy.invalid`;
  if (!u.email) warn(`users ${idNumber}: no email; given placeholder ${email}`);

  const existing = await tx.user.findFirst({ where: { OR: [{ idNumber }, { email }] } });
  if (existing) {
    warn(`users ${idNumber}: already exists in the new system (${existing.idNumber}); kept the existing account`);
    count("users", false);
    // Same ID number = same student: attach their history to the existing account.
    return existing.role === "STUDENT" && existing.idNumber === idNumber ? { id: existing.id, created: false } : null;
  }

  // The old system's admin was whoever had ID "00" (its role column said "student").
  const isAdmin = idNumber === "00" || u.role === "admin";
  const hash = String(u.password ?? "");
  // bcrypt hashes are kept as-is (upgraded to argon2 at next login); anything else was a
  // plain-text password and is hashed now.
  const passwordHash = isBcrypt(hash) ? hash : await hashPassword(hash || randomBytes(16).toString("hex"));
  if (!isBcrypt(hash)) warn(`users ${idNumber}: password wasn't hashed in the old system; hashed now`);

  const code = courseCode(u.course);
  if (!isAdmin && !code) warn(`users ${idNumber}: unknown course "${u.course}"`);

  const user = await tx.user.create({
    data: {
      idNumber,
      email,
      firstName: String(u.firstname ?? "").trim() || "(unknown)",
      middleName: String(u.midname ?? "").trim() || null,
      lastName: String(u.lastname ?? "").trim() || "(unknown)",
      role: isAdmin ? "SUPER_ADMIN" : "STUDENT",
      status: u.status === "inactive" ? "INACTIVE" : "ACTIVE",
      courseId: !isAdmin && code ? ctx.courses.get(code) : null,
      yearLevel: isAdmin ? null : clampYearLevel(u.yearlvl),
      passwordHash,
      // The old admin password was a known default ("admin123"): force a change.
      mustChangePassword: isAdmin,
    },
  });
  count("users", true);

  if (u.photo && uploadsDir) {
    const source = path.join(uploadsDir, String(u.photo));
    if (existsSync(source)) {
      try {
        const data = await sharp(readFileSync(source))
          .rotate()
          .resize(320, 320, { fit: "cover" })
          .webp({ quality: 82 })
          .toBuffer();
        const key = `photos/${user.id}-${randomBytes(6).toString("hex")}.webp`;
        photos.push({ key, data });
        await tx.user.update({ where: { id: user.id }, data: { photoUrl: `/api/files/${key}` } });
      } catch {
        warn(`users ${idNumber}: photo ${u.photo} couldn't be read as an image`);
      }
    } else {
      warn(`users ${idNumber}: photo ${u.photo} not found in ${uploadsDir}`);
    }
  }
  return { id: user.id, created: true };
}

/** The semester containing `day`; creates the academic term around it if there isn't one. */
async function semesterId(tx: Tx, day: Date, ctx: Ctx): Promise<string> {
  const hit = ctx.semesters.find((s) => s.startsOn <= day && s.endsOn >= day);
  if (hit) return hit.id;
  const term = academicTermFor(day);
  const created = await tx.semester.create({
    data: {
      name: `${term.name} (imported)`,
      startsOn: new Date(`${term.startsOn}T00:00:00Z`),
      endsOn: new Date(`${term.endsOn}T00:00:00Z`),
      sessionAllotment: 10,
      resetAppliedAt: new Date(), // past term: never trigger a session reset
    },
  });
  ctx.semesters.push(created);
  warn(`semesters: created "${created.name}" for imported history`);
  return created.id;
}

/** Old slots that match a current one reuse it; others are kept as inactive slots. */
async function timeSlotId(tx: Tx, range: { startMinute: number; endMinute: number }, ctx: Ctx) {
  const hit = ctx.slots.find((s) => s.startMinute === range.startMinute && s.endMinute === range.endMinute);
  if (hit) return hit.id;
  const label = (m: number) =>
    `${m / 60 >= 13 ? Math.floor(m / 60) - 12 : Math.floor(m / 60) || 12}:${String(m % 60).padStart(2, "0")} ${m < 720 ? "AM" : "PM"}`;
  const slot = await tx.timeSlot.create({
    data: {
      ...range,
      label: `${label(range.startMinute)} – ${label(range.endMinute)}`,
      isActive: false,
      sortOrder: 99,
    },
  });
  ctx.slots.push(slot);
  warn(`time slots: old slot ${slot.label} kept as an inactive slot`);
  return slot.id;
}

function printReport() {
  console.log(dryRun ? "DRY RUN: nothing was saved.\n" : "Import committed.\n");
  console.table(counts);
  if (warnings.length) {
    console.log(`\n${warnings.length} note(s):`);
    for (const w of warnings) console.log(`  • ${w}`);
  }
}

main()
  .catch((e) => {
    console.error("\nImport failed; nothing was saved.\n", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
