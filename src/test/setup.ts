import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Runs before any test module (and therefore before `@/db/client` reads
 * DATABASE_URL). Points the whole app at an isolated temp SQLite file so the
 * integration tests never touch the developer's forum.db.
 */
const dir = mkdtempSync(join(tmpdir(), "forum-test-"));
process.env.DATABASE_URL = join(dir, "test.db");
