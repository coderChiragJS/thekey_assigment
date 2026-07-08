import { migrate } from "drizzle-orm/libsql/migrator";
import { NextRequest } from "next/server";
import { createDb, type DB } from "@/db/client";
import { seedData } from "@/db/seed";
import type { Role } from "@/db/schema";

/**
 * Build a Drizzle client over the test DATABASE_URL (set in setup.ts), apply
 * migrations, and load the shared seed fixture. Returns a handle the tests use
 * to reset state between cases.
 */
export async function prepareTestDb(): Promise<{ db: DB; reseed: () => Promise<void> }> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set — is src/test/setup.ts loaded?");
  const { db } = createDb(url);
  await migrate(db, { migrationsFolder: "./drizzle" });
  await seedData(db);
  return { db, reseed: () => seedData(db) };
}

/** Auth headers matching the faked x-user-id / x-role scheme. */
export function authHeaders(userId: string, role: Role): Record<string, string> {
  return { "x-user-id": userId, "x-role": role };
}

/** Construct a NextRequest for invoking route handlers directly. */
export function makeRequest(
  path: string,
  init: { method?: string; headers?: Record<string, string> } = {},
): NextRequest {
  return new NextRequest(new URL(path, "http://localhost"), {
    method: init.method ?? "GET",
    headers: init.headers,
  });
}

/** Wrap a `{ postId }` into the Promise-shaped params Next 15 route handlers receive. */
export function postParams(postId: string): { params: Promise<{ postId: string }> } {
  return { params: Promise.resolve({ postId }) };
}
