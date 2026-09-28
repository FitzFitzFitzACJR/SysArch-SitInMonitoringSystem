import "server-only";
import { createPrismaClient, type Db } from "./prisma-client";

// Reuse one client across hot reloads in development; each client owns a connection pool.
const globalForDb = globalThis as unknown as { db?: Db };

export const db = globalForDb.db ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForDb.db = db;

/** Transaction client type, for service functions that must run inside `db.$transaction`. */
export type Tx = Parameters<Parameters<Db["$transaction"]>[0]>[0];
