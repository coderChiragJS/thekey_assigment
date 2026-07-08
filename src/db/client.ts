import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

export type DB = ReturnType<typeof drizzle<typeof schema>>;

/** Turn a plain path/URL into a libsql connection URL. */
export function toLibsqlUrl(pathOrUrl: string): string {
  if (
    pathOrUrl === ":memory:" ||
    /^(file:|libsql:|https?:|wss?:)/.test(pathOrUrl)
  ) {
    return pathOrUrl;
  }
  return `file:${pathOrUrl}`;
}

/** Build a Drizzle client over a libsql connection. */
export function createDb(pathOrUrl: string): { db: DB; client: Client } {
  const client = createClient({
    url: toLibsqlUrl(pathOrUrl),
    // Required only for a hosted libsql/Turso URL; undefined (and ignored) for a
    // local file. This is what makes the same code deployable to Vercel.
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  const db = drizzle(client, { schema });
  return { db, client };
}

const databaseUrl = process.env.DATABASE_URL ?? "./forum.db";

/**
 * Process-wide singleton for the app runtime. Reused across hot reloads in dev
 * so we don't leak connections. Tests build their own isolated DB instead.
 */
const globalForDb = globalThis as unknown as { __db?: DB };

export const db: DB = globalForDb.__db ?? createDb(databaseUrl).db;

if (process.env.NODE_ENV !== "production") {
  globalForDb.__db = db;
}
