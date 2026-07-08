import { pathToFileURL } from "node:url";
import type { DB } from "./client";
import { createDb } from "./client";
import { courses, enrollments, posts, savedPosts, users } from "./schema";

/**
 * Deterministic seed data, factored into a reusable function so the CLI seed
 * and the integration tests share exactly the same fixture. Re-runnable: it
 * clears the tables first, so the DB always ends in a known state.
 */
export async function seedData(db: DB): Promise<void> {
  // Clear in FK-safe order.
  await db.delete(savedPosts);
  await db.delete(posts);
  await db.delete(enrollments);
  await db.delete(courses);
  await db.delete(users);

  await db.insert(users).values([
    { id: "user_ada", name: "Ada Lovelace", role: "student" },
    { id: "user_grace", name: "Grace Hopper", role: "student" },
    { id: "user_linus", name: "Linus Torvalds", role: "student" },
    { id: "user_mod", name: "Margaret Hamilton", role: "moderator" },
  ]);

  await db.insert(courses).values([
    { id: "course_ts101", title: "Intro to TypeScript" },
    { id: "course_db201", title: "Database Design" },
    { id: "course_ux301", title: "UX Fundamentals" },
  ]);

  // Enrollments — note nobody is enrolled in every course, so the authorization
  // boundaries (403) are demonstrable by switching users in the UI.
  await db.insert(enrollments).values([
    { userId: "user_ada", courseId: "course_ts101" },
    { userId: "user_ada", courseId: "course_db201" },
    { userId: "user_grace", courseId: "course_ts101" },
    { userId: "user_grace", courseId: "course_ux301" },
    { userId: "user_linus", courseId: "course_db201" },
    // user_mod is a moderator: no enrollments needed, they bypass the check.
  ]);

  // Posts spread across courses, with spaced timestamps so "newest first" is
  // meaningful. Base time is fixed for reproducibility.
  const base = new Date("2025-06-01T09:00:00.000Z").getTime();
  const at = (hours: number) => new Date(base + hours * 3_600_000);

  await db.insert(posts).values([
    { id: "post_ts101_1", courseId: "course_ts101", authorId: "user_ada", body: "What's the difference between `unknown` and `any`?", createdAt: at(0) },
    { id: "post_ts101_2", courseId: "course_ts101", authorId: "user_grace", body: "Discriminated unions finally made pattern matching click for me.", createdAt: at(3) },
    { id: "post_ts101_3", courseId: "course_ts101", authorId: "user_ada", body: "When should I reach for `satisfies` vs a type annotation?", createdAt: at(7) },
    { id: "post_ts101_4", courseId: "course_ts101", authorId: "user_grace", body: "Strict mode caught a nasty null bug in my code today.", createdAt: at(10) },
    { id: "post_db201_1", courseId: "course_db201", authorId: "user_ada", body: "Soft deletes vs hard deletes — when do you use each?", createdAt: at(1) },
    { id: "post_db201_2", courseId: "course_db201", authorId: "user_linus", body: "A unique index is doing a lot of work in my bookmark table.", createdAt: at(5) },
    { id: "post_db201_3", courseId: "course_db201", authorId: "user_linus", body: "Keyset pagination beats OFFSET once your tables get big.", createdAt: at(9) },
    { id: "post_ux301_1", courseId: "course_ux301", authorId: "user_grace", body: "Empty states are a feature, not an afterthought.", createdAt: at(2) },
    { id: "post_ux301_2", courseId: "course_ux301", authorId: "user_grace", body: "Optimistic UI: how much lag is too much before a spinner?", createdAt: at(6) },
  ]);

  // A few existing active saves so savesCount / hasSaved are non-trivial on
  // first load. post_ts101_1 ends up with a count of 2.
  await db.insert(savedPosts).values([
    { id: "save_1", userId: "user_ada", postId: "post_ts101_1", createdAt: at(11), savedAt: at(11), unsavedAt: null },
    { id: "save_2", userId: "user_ada", postId: "post_ts101_2", createdAt: at(12), savedAt: at(12), unsavedAt: null },
    { id: "save_3", userId: "user_grace", postId: "post_ts101_1", createdAt: at(13), savedAt: at(13), unsavedAt: null },
  ]);
}

/** CLI entrypoint: `npm run db:seed`. */
async function main(): Promise<void> {
  const url = process.env.DATABASE_URL ?? "./forum.db";
  const { db, client } = createDb(url);
  await seedData(db);
  client.close();
  console.log("✓ seeded 4 users, 3 courses, 9 posts, 3 saves");
}

// Only run when invoked directly (npm run db:seed), not when imported by tests.
const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
