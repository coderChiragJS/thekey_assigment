import { migrate } from "drizzle-orm/libsql/migrator";
import { NextRequest } from "next/server";
import { createDb, type DB } from "@/db/client";
import { seedData } from "@/db/seed";
import type { Role } from "@/db/schema";

export async function prepareTestDb(): Promise<{ db: DB; reseed: () => Promise<void> }> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set — is src/test/setup.ts loaded?");
  const { db } = createDb(url);
  await migrate(db, { migrationsFolder: "./drizzle" });
  await seedData(db);
  return { db, reseed: () => seedData(db) };
}

export function authHeaders(userId: string, role: Role): Record<string, string> {
  return { "x-user-id": userId, "x-role": role };
}

export function makeRequest(
  path: string,
  init: { method?: string; headers?: Record<string, string> } = {},
): NextRequest {
  return new NextRequest(new URL(path, "http://localhost"), {
    method: init.method ?? "GET",
    headers: init.headers,
  });
}

export function postParams(postId: string): { params: Promise<{ postId: string }> } {
  return { params: Promise.resolve({ postId }) };
}
