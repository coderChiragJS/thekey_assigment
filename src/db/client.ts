import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

export type DB = ReturnType<typeof drizzle<typeof schema>>;

export function toLibsqlUrl(pathOrUrl: string): string {
  if (
    pathOrUrl === ":memory:" ||
    /^(file:|libsql:|https?:|wss?:)/.test(pathOrUrl)
  ) {
    return pathOrUrl;
  }
  return `file:${pathOrUrl}`;
}

export function createDb(pathOrUrl: string): { db: DB; client: Client } {
  const client = createClient({
    url: toLibsqlUrl(pathOrUrl),

    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  const db = drizzle(client, { schema });
  return { db, client };
}

const databaseUrl = process.env.DATABASE_URL ?? "./forum.db";

const globalForDb = globalThis as unknown as { __db?: DB };

export const db: DB = globalForDb.__db ?? createDb(databaseUrl).db;

if (process.env.NODE_ENV !== "production") {
  globalForDb.__db = db;
}
