import "server-only";
import { createPrismaClient, type Db } from "./prisma-client";

// Reuse one client across hot reloads in development; each client owns a connection pool.
const globalForDb = globalThis as unknown as { db?: Db };

export const db = globalForDb.db ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForDb.db = db;

/** Transaction client type, for service functions that must run inside `db.$transaction`. */
export type Tx = Parameters<Parameters<Db["$transaction"]>[0]>[0];

/**
 * Runs `fn` in a SERIALIZABLE transaction, retrying a few times if Postgres aborts it because
 * a concurrent transaction conflicted (e.g. two students booking the last free place).
 * Use for "check a count, then insert" rules that a unique index can't express.
 */
export async function serializable<T>(fn: (tx: Tx) => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await db.$transaction(fn, { isolationLevel: "Serializable" });
    } catch (e) {
      const code = (e as { code?: string }).code;
      const retryable = code === "P2034" || /could not serialize|40001/.test(String((e as Error).message));
      if (!retryable || i >= attempts) throw e;
      await new Promise((r) => setTimeout(r, 20 * i + Math.random() * 30));
    }
  }
}
