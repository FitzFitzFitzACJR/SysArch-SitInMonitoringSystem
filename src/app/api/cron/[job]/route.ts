import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { flushEmails } from "@/features/notifications/email-outbox";
import { sweepReservations } from "@/features/reservations/service";
import { sweepSitIns } from "@/features/sit-ins/service";

// Scheduled jobs. Vercel Cron (or any external scheduler) calls
//   GET /api/cron/<job>   with   Authorization: Bearer $CRON_SECRET
// Every job is idempotent, so running one late, early or twice is harmless.
const JOBS: Record<string, () => Promise<unknown>> = {
  "sit-ins": () => sweepSitIns(),
  reservations: () => sweepReservations(),
  emails: () => flushEmails(),
  // One endpoint for schedulers that only allow a single job (e.g. a free external cron).
  all: async () => ({
    sitIns: await sweepSitIns(),
    reservations: await sweepReservations(),
    emails: await flushEmails(),
  }),
};

export async function GET(req: Request, ctx: RouteContext<"/api/cron/[job]">) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !authorized(req.headers.get("authorization"), `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { job } = await ctx.params;
  const run = JOBS[job];
  if (!run) return NextResponse.json({ error: `Unknown job "${job}"` }, { status: 404 });
  return NextResponse.json({ job, result: await run() });
}

function authorized(given: string | null, expected: string) {
  const a = Buffer.from(given ?? "");
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
