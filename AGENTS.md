<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project conventions

- Business rules live in `src/features/<feature>/service.ts` and run inside `db.$transaction`. Server actions (`actions.ts`) are thin: they go through `createAction` in `src/lib/action.ts` (auth → permission → Zod → service).
- Zod schemas in `features/<feature>/schemas.ts` are shared by forms and actions. Never duplicate validation.
- Every staff mutation writes an `AuditLog` row via `writeAudit(tx, …)` in the same transaction.
- Every change to `User.remainingSessions` / `pointsBalance` must write a `PointsLog` row in the same transaction.
- No business values are hardcoded; read them from `getSettings()`.
- Pages call `requireStudent()` / `requireStaff(permission)` themselves; layouts don't re-run on client navigation.
- Rules Prisma can't express (partial unique indexes, CHECKs) go in migration SQL. Keep them in sync with the service checks.
