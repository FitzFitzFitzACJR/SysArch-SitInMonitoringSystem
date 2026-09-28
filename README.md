# CCS Sit-In Monitoring System

A rewrite of a PHP/MySQL college project for running the College of Computer Studies computer labs:
student sit-ins, reservations, lab computers, points and reports. Built with Next.js, TypeScript,
PostgreSQL and Prisma.

> 🚧 **Work in progress.** This README grows with each build phase; the full write-up
> (architecture, screenshots, deployment) lands in the final phase.

## Status

| Phase | Scope                                                           | State |
| ----- | --------------------------------------------------------------- | ----- |
| a     | Setup, auth, roles/permissions, settings, seed                  | ✅    |
| b     | Students (bulk import, profile), labs, computers                | ✅    |
| c     | Sit-in lifecycle: QR check-in/out, time limits, auto-end        | ✅    |
| d     | Reservations: calendar, conflicts, computer selection, no-shows | ✅    |
| e     | Live lab map + computer issue reporting                         | ✅    |
| f     | Notifications (in-app + email), announcements, feedback         | ✅    |
| g     | Points, leaderboard, semesters                                  | ✅    |
| h     | Reports, exports, analytics, audit log                          | ✅    |
| i     | Data migration from the original `sysarch.sql`                  | ✅    |
| j     | Extras, tests, README, deployment guide                         | ⏳    |

## Running locally

Requirements: Node.js 20.9+ and Docker Desktop.

```bash
cp .env.example .env        # then set AUTH_SECRET (npx auth secret)
npm install
npm run db:up               # Postgres in Docker
npm run db:deploy           # apply migrations
npm run db:seed             # labs, computers, time slots, admin + demo accounts
npm run dev
```

Sign in with the admin ID number and password from `SEED_ADMIN_*` in `.env`; you'll be asked to
choose a new password. With `SEED_DEMO=true` there is also a lab staff account (`staff`) and
five students (`2024-0001` … `2024-0005`), all using `SEED_DEMO_PASSWORD`.

Emails (password reset, etc.) are printed to the dev server console unless `RESEND_API_KEY` is set.

## Scripts

| Command                              | What it does                                                |
| ------------------------------------ | ----------------------------------------------------------- |
| `npm run dev`                        | Dev server                                                  |
| `npm test`                           | Unit tests (Vitest)                                         |
| `npm run typecheck` / `npm run lint` | Type and lint checks                                        |
| `npm run db:migrate`                 | Create a new migration after editing `prisma/schema.prisma` |
| `npm run db:studio`                  | Browse the database                                         |

## Project layout

```text
prisma/            schema, migrations (incl. raw-SQL business-rule indexes), seed
src/app/           routes: (auth), (student), admin/, api/
src/features/<x>/  one folder per domain: schemas.ts (Zod, shared) · service.ts (rules) ·
                   queries.ts (reads) · actions.ts (server actions) · components/
src/lib/           db, auth, permissions, action wrapper, email, time helpers
tests/unit/        Vitest
```

## Migrating from the original PHP system

`scripts/legacy-import` reads the old `sysarch.sql` MySQL dump and imports it into this
database in a single transaction (all or nothing). Run it after migrating and seeding:

```bash
npm run legacy:import -- --file path/to/sysarch.sql --dry-run
npm run legacy:import -- --file path/to/sysarch.sql --uploads path/to/old/uploads --default-lab 524
```

What it does:

- **Users**: keeps the old bcrypt password hashes (they're upgraded to argon2 at each
  person's next login; any plain-text password is hashed on import). The old admin
  (`idno` `00`) becomes a super admin who must change their password. Course numbers map
  to BSIT/BSA/BSCS/BSCRIM. `--uploads` brings profile photos across (re-encoded).
- **Points & sessions**: old `points_log` rows become history, plus an opening balance,
  so every balance equals its ledger.
- **Sit-ins**: the old app wrote `session_start` with MySQL's clock (Manila) and
  `session_end` with PHP's `date()` (XAMPP's default Europe/Berlin), which is why it
  showed a −360-minute duration. Each column is read in its own zone (`--mysql-tz`,
  `--php-tz`); that sit-in really lasted 14 seconds. Sit-ins left "active" or forgotten
  for days are closed at the time limit or closing time, as the new system would have.
- **Reservations**: rows where the language was saved as the purpose are swapped back;
  past bookings are closed (so the no-show job can't penalise them); rows without a room
  are skipped unless you pass `--default-lab`.
- **Everything else**: announcements (inactive ones archived), both feedback tables, link
  resources (old local files must be re-uploaded), class schedules. The leaderboard table
  isn't needed: it's now calculated from sit-ins.

It prints a table of what was imported/skipped and a note for every correction, and it
refuses to run twice against the same database.
