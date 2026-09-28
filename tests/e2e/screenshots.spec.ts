import { test, type Page } from "@playwright/test";
import { Client } from "pg";
import { E2E_DATABASE_URL } from "../../playwright.config";
import { E2E, login } from "./fixtures";

// README screenshots. Not part of the normal run:  SCREENSHOTS=1 npx playwright test screenshots
// Adds three weeks of believable history to the (throwaway) e2e database first, so the
// charts and leaderboard have something to show.
test.skip(!process.env.SCREENSHOTS, "set SCREENSHOTS=1 to capture README screenshots");
test.describe.configure({ mode: "serial" });

const OUT = "docs/screenshots";

async function shot(page: Page, name: string, fullPage = true) {
  await page.waitForLoadState("networkidle").catch(() => {}); // SSE pages never go fully idle
  await page.waitForTimeout(800); // chart animations
  if (fullPage) {
    // Grow the viewport to the page instead of using fullPage, so the fixed sidebar spans it too.
    const width = page.viewportSize()!.width;
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: `${OUT}/${name}.png` });
  await page.setViewportSize({ width: page.viewportSize()!.width, height: 800 });
}

test.beforeAll(async () => {
  const db = new Client({ connectionString: E2E_DATABASE_URL });
  await db.connect();
  try {
    const one = async (sql: string, params: unknown[] = []) => (await db.query(sql, params)).rows[0];
    const all = async (sql: string, params: unknown[] = []) => (await db.query(sql, params)).rows;
    if ((await one(`SELECT count(*)::int AS n FROM "SitIn"`)).n > 5) return; // already populated

    const staff = await one(`SELECT id FROM "User" WHERE "idNumber" = $1`, [E2E.staff]);
    const semester = await one(`SELECT id FROM "Semester" ORDER BY "startsOn" DESC LIMIT 1`);
    const students = await all(
      `SELECT id, "idNumber", "remainingSessions" FROM "User" WHERE role = 'STUDENT' ORDER BY "idNumber"`,
    );
    const labs = await all(`SELECT id, code FROM "Lab" ORDER BY "sortOrder"`);
    const languages = await all(`SELECT id FROM "Language" ORDER BY "sortOrder"`);

    // Deterministic pseudo-random numbers, so the screenshots are reproducible.
    let seed = 42;
    const rand = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
    const pick = <T>(xs: T[]) => xs[Math.floor(rand() * xs.length)];

    // Prisma's DateTime columns are "timestamp without time zone" holding UTC, so send UTC strings;
    // pg would otherwise write the machine's local wall-clock time.
    const utc = (d: Date) => d.toISOString();

    const insert = async (s: {
      student: string;
      lab: string;
      pc: number;
      start: Date;
      minutes: number;
      active?: boolean;
      rewarded?: boolean;
    }) => {
      const computer = await one(`SELECT id FROM "Computer" WHERE "labId" = $1 AND number = $2`, [s.lab, s.pc]);
      const end = new Date(s.start.getTime() + s.minutes * 60_000);
      const row = await one(
        `INSERT INTO "SitIn" (id, "studentId", "labId", "computerId", "languageId", purpose, "semesterId", status,
           "startedAt", "endsAt", "endedAt", "endReason", rewarded, "startedById", "endedById")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'Lab exercise', $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id`,
        [
          s.student,
          s.lab,
          computer.id,
          pick(languages).id,
          semester.id,
          s.active ? "ACTIVE" : "COMPLETED",
          utc(s.start),
          utc(s.active ? new Date(Date.now() + 2 * 3600_000) : new Date(s.start.getTime() + 3 * 3600_000)),
          s.active ? null : utc(end),
          s.active ? null : "STAFF",
          !!s.rewarded,
          staff.id,
          s.active ? null : staff.id,
        ],
      );
      await db.query(
        `INSERT INTO "PointsLog" (id, "userId", "sessionsDelta", reason, "actorId", "sitInId", "semesterId", "createdAt")
         VALUES (gen_random_uuid()::text, $1, -1, 'SIT_IN_START', $2, $3, $4, $5)`,
        [s.student, staff.id, row.id, semester.id, utc(s.start)],
      );
      if (s.rewarded)
        await db.query(
          `INSERT INTO "PointsLog" (id, "userId", "pointsDelta", reason, "actorId", "sitInId", "semesterId", "createdAt")
           VALUES (gen_random_uuid()::text, $1, 1, 'SIT_IN_REWARD', $2, $3, $4, $5)`,
          [s.student, staff.id, row.id, semester.id, utc(end)],
        );
    };

    // Weekday-heavy history over the last three weeks, busiest mid-morning and early afternoon.
    for (let daysAgo = 21; daysAgo >= 1; daysAgo--) {
      const day = new Date(Date.now() - daysAgo * 86_400_000);
      const weekend = [0, 6].includes(day.getDay());
      for (const student of students) {
        if (rand() < (weekend ? 0.8 : 0.35)) continue;
        if (student.remainingSessions <= 3) continue; // leave a few sessions (and one for the live sit-in)
        student.remainingSessions--;
        const hour = pick([8, 9, 9, 10, 10, 10, 13, 13, 14, 15, 16]);
        // Manila is UTC+8.
        const start = new Date(
          Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hour - 8, Math.floor(rand() * 50)),
        );
        await insert({
          student: student.id,
          lab: pick(labs).id,
          pc: 1 + Math.floor(rand() * 40),
          start,
          minutes: 35 + Math.floor(rand() * 110),
          rewarded: rand() < 0.4,
        });
      }
    }

    // A few students in the lab right now, for the live map and the student dashboard.
    const lab524 = labs.find((l) => l.code === "524")!.id;
    const now = Date.now();
    const current = students.filter((s) => ["2024-0003", "2024-0004", "2024-0005"].includes(s.idNumber));
    for (const [i, s] of current.entries())
      await insert({
        student: s.id,
        lab: lab524,
        pc: [5, 12, 23][i],
        start: new Date(now - (20 + i * 15) * 60_000),
        minutes: 0,
        active: true,
      });
    await db.query(
      `UPDATE "Computer" SET state = 'MAINTENANCE', note = 'Keyboard replacement' WHERE "labId" = $1 AND number = 30`,
      [lab524],
    );

    // Keep the ledger invariant: balances are the sum of the ledger.
    await db.query(`
      UPDATE "User" u SET "remainingSessions" = l.sessions, "pointsBalance" = l.points, "lifetimePoints" = coalesce(l.earned, 0)
      FROM (SELECT "userId", sum("sessionsDelta")::int AS sessions, sum("pointsDelta")::int AS points,
                   (sum("pointsDelta") FILTER (WHERE "pointsDelta" > 0 AND reason <> 'POINTS_CONVERSION'))::int AS earned
            FROM "PointsLog" GROUP BY "userId") l
      WHERE l."userId" = u.id`);
  } finally {
    await db.end();
  }
});

test("student screens", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await login(page, "2024-0003");
  await shot(page, "student-dashboard");
  await page.goto("/lab-map");
  await page.getByRole("button", { name: /^PC 5,/ }).waitFor();
  await shot(page, "student-lab-map");
  await page.goto("/stats");
  await shot(page, "student-stats");
  await page.goto("/leaderboard");
  await shot(page, "leaderboard");
});

test("student on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, "2024-0003");
  await shot(page, "mobile-dashboard", false);
});

test("staff screens", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await login(page, E2E.staff);
  await shot(page, "admin-dashboard");
  await page.goto("/admin/sit-ins");
  await shot(page, "admin-sit-ins");
  await page.goto("/admin/labs");
  await page.getByRole("link", { name: "Lab 524" }).click();
  await page.getByRole("button", { name: /^PC 5,/ }).waitFor();
  await shot(page, "admin-lab-map");
  await page.goto("/admin/reports");
  await shot(page, "admin-reports");
});

test.describe("dark mode", () => {
  test.use({ colorScheme: "dark" });
  test("staff dashboard", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await login(page, E2E.staff);
    await shot(page, "admin-dashboard-dark");
  });
});

test("login", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/login");
  await shot(page, "login", false);
});
