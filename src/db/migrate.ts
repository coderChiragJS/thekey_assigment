import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { toLibsqlUrl } from "./client";

const url = toLibsqlUrl(process.env.DATABASE_URL ?? "./forum.db");
const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
const db = drizzle(client);

await migrate(db, { migrationsFolder: "./drizzle" });
client.close();

console.log(`✓ migrations applied to ${url}`);
