import { sql } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * Users. `role` gates authorization. Auth itself is faked (read from headers),
 * but the role stored here is what the API enforces against.
 */
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role", { enum: ["student", "moderator"] }).notNull(),
});

export const courses = sqliteTable("courses", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
});

/**
 * Enrollments define what a student is allowed to see. A student may only read
 * posts in a course they're enrolled in; moderators bypass this entirely.
 */
export const enrollments = sqliteTable(
  "enrollments",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id),
  },
  (t) => [primaryKey({ columns: [t.userId, t.courseId] })],
);

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id),
  body: text("body").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  // Moderator soft-remove. Removed posts disappear from feeds/saved lists but
  // the row (and its history) is preserved.
  removedAt: integer("removed_at", { mode: "timestamp_ms" }),
});

/**
 * The bookmark relationship — one row per (user, post) FOREVER.
 *
 *  - `createdAt`  first-ever save; immutable, preserves history across re-saves.
 *  - `savedAt`    updated on every save / re-save; drives "most-recently-saved first".
 *  - `unsavedAt`  soft-delete marker. NULL == active (currently saved).
 *
 * The unique index on (userId, postId) is the guarantee that un-save + re-save
 * reactivates the same record instead of creating a duplicate active save.
 */
export const savedPosts = sqliteTable(
  "saved_posts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    savedAt: integer("saved_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    unsavedAt: integer("unsaved_at", { mode: "timestamp_ms" }),
  },
  (t) => [uniqueIndex("saved_posts_user_post_unique").on(t.userId, t.postId)],
);

export type UserRow = typeof users.$inferSelect;
export type CourseRow = typeof courses.$inferSelect;
export type PostRow = typeof posts.$inferSelect;
export type SavedPostRow = typeof savedPosts.$inferSelect;
export type Role = UserRow["role"];
