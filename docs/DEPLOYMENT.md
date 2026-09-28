# Deploying

The app is a standard Next.js project. This guide covers the setup it was designed for,
**Vercel** plus a hosted Postgres (**Neon** or **Supabase**). Any Node 20.9+ host with Postgres
works the same way: run `npm run db:deploy`, then `npm run build` and `npm start`.

## 1. Database

Create a Postgres database on Neon or Supabase and copy two connection strings:

| Variable       | Which URL                                                    | Used by               |
| -------------- | ------------------------------------------------------------ | --------------------- |
| `DATABASE_URL` | the **pooled** one (Neon `-pooler` host, Supabase port 6543) | the running app       |
| `DIRECT_URL`   | the **direct**, non-pooled one                               | `prisma migrate` only |

Migrations need a direct connection, because poolers in transaction mode break the advisory
lock Prisma takes. `prisma.config.ts` uses `DIRECT_URL` when it is set and falls back to
`DATABASE_URL` otherwise.

## 2. Vercel project

Import the repository in Vercel. The framework preset is detected automatically. The
`vercel-build` script runs `prisma migrate deploy && next build`, so every deploy applies
pending migrations before the new code goes live. (`npm install` also runs `prisma generate`
through `postinstall`.)

Set these environment variables for Production (and Preview, if you use it):

| Variable                | Value                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| `DATABASE_URL`          | pooled URL from step 1                                                                        |
| `DIRECT_URL`            | direct URL from step 1                                                                        |
| `AUTH_SECRET`           | `npx auth secret` or `openssl rand -base64 33`                                                |
| `APP_URL`               | the public URL, e.g. `https://ccs-sitin.vercel.app` (used in emailed links)                   |
| `CRON_SECRET`           | `openssl rand -hex 32` (protects the scheduled-job endpoints)                                 |
| `BLOB_READ_WRITE_TOKEN` | create a Blob store under **Storage** and connect it; Vercel adds this variable automatically |
| `RESEND_API_KEY`        | from resend.com (optional; without it, emails are only logged)                                |
| `EMAIL_FROM`            | a sender on a domain verified in Resend, e.g. `CCS Sit-In <no-reply@your-domain>`             |

File uploads (profile photos, lab resources) **need** Blob storage on Vercel: the local
`./uploads` fallback is for development only, since serverless file systems are temporary.

## 3. Seed once

The seed creates the labs, computers, time slots, courses, languages, the current semester and
the first super admin. Run it once, from your machine, against the production database:

```bash
DATABASE_URL="<direct url>" SEED_DEMO=false \
SEED_ADMIN_ID_NUMBER="admin" SEED_ADMIN_EMAIL="you@school.edu" SEED_ADMIN_PASSWORD="<temporary>" \
npm run db:seed
```

The admin has to choose a new password at first sign-in. The seed is idempotent: running
it again only fills in anything missing. Keep `SEED_DEMO=false` in production, or the demo
staff and student accounts are created too.

To bring over data from the original PHP system, run the legacy importer the same way (see
the README): first with `--dry-run`, then for real.

## 4. Scheduled jobs

Some work happens on a timer, all of it idempotent:

- ending sit-ins that ran past their limit or past closing time
- reservation reminders and no-show handling
- the start-of-semester reset
- sending queued emails

The jobs are exposed as `GET /api/cron/<job>`. The job is one of `sit-ins`, `reservations`,
`emails`, `semesters`, or `all`, and every call must send `Authorization: Bearer $CRON_SECRET`.

The app also runs the sweeps lazily, at most every 30 seconds, whenever someone loads a page,
so a quiet cron only delays reminders and emails. Still, set one up:

- **Vercel Hobby:** cron jobs can only run once a day, which is too slow. Use a free external
  scheduler such as cron-job.org, GitHub Actions or Upstash QStash. Have it call
  `https://<your-app>/api/cron/all` every 5 minutes with the header
  `Authorization: Bearer <CRON_SECRET>`.
- **Vercel Pro:** add a `vercel.json`. Vercel sends the `CRON_SECRET` bearer header by itself.

  ```json
  {
    "crons": [
      { "path": "/api/cron/sit-ins", "schedule": "*/5 * * * *" },
      { "path": "/api/cron/reservations", "schedule": "*/5 * * * *" },
      { "path": "/api/cron/emails", "schedule": "*/5 * * * *" },
      { "path": "/api/cron/semesters", "schedule": "0 16 * * *" }
    ]
  }
  ```

  Vercel cron schedules are in UTC; `0 16 * * *` is midnight in Manila.

## 5. Live lab map (Server-Sent Events)

`/api/labs/<id>/stream` is a long-lived response. Each stream closes itself after 55 seconds,
which keeps it inside serverless time limits (`maxDuration = 60`). The browser reconnects
within a second, so viewers don't notice. On Vercel every open map holds one function
invocation, which is fine for a lab's worth of viewers. Snapshots are cached for 2 seconds
and shared, so many viewers don't multiply database load. Behind nginx, the
`X-Accel-Buffering: no` header already disables buffering.

## 6. After the first deploy

1. Sign in as the admin and change the password.
2. Open **Settings**: timezone, lab hours, session allotment, time limits, reservation
   rules and lab rules text.
3. Check **Semesters**. The seed created the current one, so add the next when it's scheduled.
4. Add lab staff under **Staff**. They receive an email link to set their own password.
5. Import students under **Students → Import** (CSV or Excel), or let them self-register.
