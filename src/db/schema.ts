import { sql } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role", { enum: ["student", "moderator"] }).notNull(),
});

export const courses = sqliteTable("courses", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
});

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

  removedAt: integer("removed_at", { mode: "timestamp_ms" }),
});

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
