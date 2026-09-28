import { auth } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import { getLabSnapshot, publicSnapshot } from "@/features/lab-map/snapshot";
import { sweepIfStale } from "@/features/sit-ins/service";

// Live lab map over Server-Sent Events. The loop re-reads the (shared, 2s-cached) snapshot
// and pushes it only when something changed. The stream ends itself before typical
// serverless time limits; EventSource reconnects on its own, so viewers don't notice.
export const maxDuration = 60;

const POLL_MS = 2_000;
const HEARTBEAT_MS = 15_000;
const LIFETIME_MS = 55_000;

export async function GET(req: Request, ctx: RouteContext<"/api/labs/[id]/stream">) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const staff = isStaff(session.user.role);
  const { id } = await ctx.params;

  const first = await getLabSnapshot(id);
  if (!first) return new Response("Not found", { status: 404 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let last = "";
      let lastBeat = Date.now();
      const startedAt = Date.now();
      const send = (text: string) => controller.enqueue(encoder.encode(text));

      send("retry: 1000\n\n"); // reconnect quickly when we close the stream
      try {
        while (!req.signal.aborted && Date.now() - startedAt < LIFETIME_MS) {
          await sweepIfStale(); // end overdue sit-ins so the map never shows stale "in use"
          const snapshot = await getLabSnapshot(id);
          if (!snapshot) break;
          const json = JSON.stringify(staff ? snapshot : publicSnapshot(snapshot));
          // Compare without the timestamp, which changes on every rebuild.
          const key = json.replace(/"generatedAt":"[^"]*",/, "");
          if (key !== last) {
            send(`event: snapshot\ndata: ${json}\n\n`);
            last = key;
          } else if (Date.now() - lastBeat > HEARTBEAT_MS) {
            send(": keep-alive\n\n"); // comment line; stops proxies closing an idle stream
            lastBeat = Date.now();
          }
          await new Promise((r) => setTimeout(r, POLL_MS));
        }
      } catch (e) {
        console.error("[lab-stream]", e);
      } finally {
        try {
          controller.close();
        } catch {
          // already closed by the client
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // disable proxy buffering (nginx)
    },
  });
}
