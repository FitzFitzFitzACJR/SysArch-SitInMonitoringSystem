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
| e     | Live lab map + computer issue reporting                         | ⏳    |
| f     | Notifications (in-app + email), announcements, feedback         |       |
| g     | Points, leaderboard, semesters                                  |       |
| h     | Reports, exports, analytics, audit log                          |       |
| i     | Data migration from the original `sysarch.sql`                  |       |
| j     | Extras, tests, README, deployment guide                         |       |

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
