import { execSync } from "node:child_process";
import { Client } from "pg";
import { E2E_DATABASE_URL } from "../../playwright.config";
import { E2E } from "./fixtures";

/**
 * Recreates the e2e database from scratch on every run: migrate, seed demo data, then
 * make it time-independent (labs open around the clock) so tests pass at any hour.
 */
export default async function globalSetup() {
  const url = new URL(E2E_DATABASE_URL);
  const name = url.pathname.slice(1);
  if (!/e2e|test/.test(name))
    throw new Error(`Refusing to recreate "${name}": the e2e database name must contain "e2e" or "test".`);

  const admin = new Client({ connectionString: Object.assign(new URL(url), { pathname: "/postgres" }).toString() });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
  await admin.query(`CREATE DATABASE "${name}"`);
  await admin.end();

  const env = {
    ...process.env,
    DATABASE_URL: E2E_DATABASE_URL,
    DIRECT_URL: "",
    SEED_DEMO: "true",
    SEED_DEMO_PASSWORD: E2E.password,
    SEED_ADMIN_ID_NUMBER: E2E.admin,
    SEED_ADMIN_EMAIL: "admin@e2e.local",
    SEED_ADMIN_PASSWORD: E2E.adminInitialPassword,
  };
  execSync("npx prisma migrate deploy", { env, stdio: "inherit" });
  execSync("npx prisma db seed", { env, stdio: "inherit" });

  const db = new Client({ connectionString: E2E_DATABASE_URL });
  await db.connect();
  // Open every lab all day so sit-ins can start whenever the tests run.
  await db.query(`UPDATE "Lab" SET "opensAt" = 0, "closesAt" = 1439`);
  // Every demo student except the "new student" has already accepted the lab rules.
  await db.query(`UPDATE "User" SET "rulesAcceptedVer" = 1 WHERE role = 'STUDENT' AND "idNumber" <> $1`, [
    E2E.newStudent,
  ]);
  await db.end();
}
