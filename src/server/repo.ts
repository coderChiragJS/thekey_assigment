import { and, desc, eq, isNull, lt, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { randomUUID } from "node:crypto";
import type { DB } from "@/db/client";
import { courses, enrollments, posts, savedPosts, users } from "@/db/schema";
import { applySave, applyUnsave, type SaveRecord } from "@/domain/saves";
import type { AuthContext } from "./auth";
import { forbidden, notFound } from "./errors";
import {
  clampLimit,
  decodeCursor,
  encodeCursor,
  type Cursor,
} from "./pagination";

/* ------------------------------------------------------------------ DTOs -- */

export interface PostDTO {
  id: string;
  courseId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string; // ISO
  hasSaved: boolean;
  savesCount: number;
}

export interface SavedPostDTO extends PostDTO {
  savedAt: string; // ISO — drives most-recently-saved ordering
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface CourseDTO {
  id: string;
  title: string;
}

export interface SaveFlags {
  postId: string;
  hasSaved: boolean;
  savesCount: number;
}

/* ------------------------------------------------------------- primitives -- */

async function getCourse(db: DB, courseId: string) {
  const rows = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);
  return rows[0] ?? null;
}

/** An "existing" post that hasn't been moderator-removed. */
async function getActivePost(db: DB, postId: string) {
  const rows = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, postId), isNull(posts.removedAt)))
    .limit(1);
  return rows[0] ?? null;
}

async function isEnrolled(db: DB, userId: string, courseId: string) {
  const rows = await db
    .select({ userId: enrollments.userId })
    .from(enrollments)
    .where(
      and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)),
    )
    .limit(1);
  return rows.length > 0;
}

/**
 * Enforce that the caller may act within a course. Moderators bypass
 * enrollment; students must be enrolled (else 403).
 */
async function assertCourseAccess(db: DB, ctx: AuthContext, courseId: string) {
  if (ctx.role === "moderator") return;
  if (!(await isEnrolled(db, ctx.userId, courseId))) {
    throw forbidden("You are not enrolled in this course");
  }
}

/**
 * Fetch the current save flags for a single post in ONE aggregate query:
 * `savesCount` = active saves across all users, `hasSaved` = caller has an
 * active save.
 */
async function getSaveFlags(
  db: DB,
  userId: string,
  postId: string,
): Promise<{ hasSaved: boolean; savesCount: number }> {
  const rows = await db
    .select({
      savesCount: sql<number>`count(${savedPosts.id})`,
      hasSaved: sql<number>`coalesce(max(case when ${savedPosts.userId} = ${userId} then 1 else 0 end), 0)`,
    })
    .from(savedPosts)
    .where(and(eq(savedPosts.postId, postId), isNull(savedPosts.unsavedAt)));
  const row = rows[0];
  return {
    savesCount: Number(row?.savesCount ?? 0),
    hasSaved: Boolean(Number(row?.hasSaved ?? 0)),
  };
}

/** Load the (single) bookmark row for a user/post in any state, as a domain record. */
async function getSaveRecord(
  db: DB,
  userId: string,
  postId: string,
): Promise<{ id: string; record: SaveRecord } | null> {
  const rows = await db
    .select()
    .from(savedPosts)
    .where(and(eq(savedPosts.userId, userId), eq(savedPosts.postId, postId)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    record: {
      createdAt: row.createdAt,
      savedAt: row.savedAt,
      unsavedAt: row.unsavedAt,
    },
  };
}

/* --------------------------------------------------------------- queries -- */

export async function listVisibleCourses(
  db: DB,
  ctx: AuthContext,
): Promise<CourseDTO[]> {
  if (ctx.role === "moderator") {
    return db
      .select({ id: courses.id, title: courses.title })
      .from(courses)
      .orderBy(courses.title);
  }
  return db
    .select({ id: courses.id, title: courses.title })
    .from(courses)
    .innerJoin(enrollments, eq(enrollments.courseId, courses.id))
    .where(eq(enrollments.userId, ctx.userId))
    .orderBy(courses.title);
}

/**
 * Paginated feed for a course, newest first, with hasSaved + savesCount
 * hydrated in a SINGLE query (LEFT JOIN active saves + aggregate) — no N+1.
 */
export async function getCourseFeed(
  db: DB,
  ctx: AuthContext,
  input: { courseId: string; cursor?: string | null; limit?: number },
): Promise<Page<PostDTO>> {
  const course = await getCourse(db, input.courseId);
  if (!course) throw notFound("Course not found");
  await assertCourseAccess(db, ctx, input.courseId);

  const limit = clampLimit(input.limit);
  const cur = decodeCursor(input.cursor);

  const rows = await db
    .select({
      id: posts.id,
      courseId: posts.courseId,
      authorId: posts.authorId,
      authorName: users.name,
      body: posts.body,
      createdAt: posts.createdAt,
      savesCount: sql<number>`count(${savedPosts.id})`,
      hasSaved: sql<number>`coalesce(max(case when ${savedPosts.userId} = ${ctx.userId} then 1 else 0 end), 0)`,
    })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.authorId))
    .leftJoin(
      savedPosts,
      and(eq(savedPosts.postId, posts.id), isNull(savedPosts.unsavedAt)),
    )
    .where(
      and(
        eq(posts.courseId, input.courseId),
        isNull(posts.removedAt),
        keysetWhere(posts.createdAt, posts.id, cur),
      ),
    )
    .groupBy(posts.id)
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(limit + 1);

  return paginate(rows, limit, (r) => ({
    dto: toPostDTO(r),
    ts: r.createdAt.getTime(),
    id: r.id,
  }));
}

/**
 * The caller's own saved posts, most-recently-saved first, paginated. There is
 * no userId parameter — the list is always scoped to the authenticated caller,
 * which structurally enforces the "own list only" rule.
 */
export async function getSavedList(
  db: DB,
  ctx: AuthContext,
  input: { cursor?: string | null; limit?: number },
): Promise<Page<SavedPostDTO>> {
  const limit = clampLimit(input.limit);
  const cur = decodeCursor(input.cursor);

  // `savedPosts` (unaliased) = the caller's active save, which defines list
  // membership + the savedAt ordering. `allSaves` = every active save on that
  // post, aggregated for savesCount. One query, no N+1.
  const allSaves = alias(savedPosts, "all_saves");

  const rows = await db
    .select({
      id: posts.id,
      courseId: posts.courseId,
      authorId: posts.authorId,
      authorName: users.name,
      body: posts.body,
      createdAt: posts.createdAt,
      savedAt: savedPosts.savedAt,
      savedRowId: savedPosts.id,
      savesCount: sql<number>`count(${allSaves.id})`,
    })
    .from(savedPosts)
    .innerJoin(
      posts,
      and(eq(posts.id, savedPosts.postId), isNull(posts.removedAt)),
    )
    .innerJoin(users, eq(users.id, posts.authorId))
    .leftJoin(
      allSaves,
      and(eq(allSaves.postId, posts.id), isNull(allSaves.unsavedAt)),
    )
    .where(
      and(
        eq(savedPosts.userId, ctx.userId),
        isNull(savedPosts.unsavedAt),
        keysetWhere(savedPosts.savedAt, savedPosts.id, cur),
      ),
    )
    .groupBy(posts.id)
    .orderBy(desc(savedPosts.savedAt), desc(savedPosts.id))
    .limit(limit + 1);

  return paginate(rows, limit, (r) => ({
    dto: {
      id: r.id,
      courseId: r.courseId,
      authorId: r.authorId,
      authorName: r.authorName,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      savedAt: r.savedAt.toISOString(),
      hasSaved: true, // by construction, everything here is saved by the caller
      savesCount: Number(r.savesCount),
    } satisfies SavedPostDTO,
    ts: r.savedAt.getTime(),
    id: r.savedRowId,
  }));
}

/* -------------------------------------------------------------- mutations -- */

export async function savePost(
  db: DB,
  ctx: AuthContext,
  postId: string,
): Promise<SaveFlags> {
  const post = await getActivePost(db, postId);
  if (!post) throw notFound("Post not found");
  await assertCourseAccess(db, ctx, post.courseId);

  const now = new Date();
  const existing = await getSaveRecord(db, ctx.userId, postId);
  const { record, changed } = applySave(existing?.record ?? null, now);

  if (changed) {
    if (existing) {
      await db
        .update(savedPosts)
        .set({ savedAt: record.savedAt, unsavedAt: null })
        .where(eq(savedPosts.id, existing.id));
    } else {
      // onConflict makes the insert idempotent under a concurrent double-save:
      // the unique (userId, postId) index turns the race into a reactivation.
      await db
        .insert(savedPosts)
        .values({
          id: randomUUID(),
          userId: ctx.userId,
          postId,
          createdAt: record.createdAt,
          savedAt: record.savedAt,
          unsavedAt: null,
        })
        .onConflictDoUpdate({
          target: [savedPosts.userId, savedPosts.postId],
          set: { savedAt: record.savedAt, unsavedAt: null },
        });
    }
  }

  const flags = await getSaveFlags(db, ctx.userId, postId);
  return { postId, ...flags };
}

export async function unsavePost(
  db: DB,
  ctx: AuthContext,
  postId: string,
): Promise<SaveFlags> {
  const post = await getActivePost(db, postId);
  if (!post) throw notFound("Post not found");
  await assertCourseAccess(db, ctx, post.courseId);

  const now = new Date();
  const existing = await getSaveRecord(db, ctx.userId, postId);
  const { record, changed } = applyUnsave(existing?.record ?? null, now);

  if (changed && existing) {
    await db
      .update(savedPosts)
      .set({ unsavedAt: record.unsavedAt })
      .where(eq(savedPosts.id, existing.id));
  }

  const flags = await getSaveFlags(db, ctx.userId, postId);
  return { postId, ...flags };
}

/** Moderator-only: soft-remove a post. Students are rejected (403) upstream. */
export async function removePost(
  db: DB,
  ctx: AuthContext,
  postId: string,
): Promise<void> {
  if (ctx.role !== "moderator") {
    throw forbidden("Only moderators can remove posts");
  }
  const post = await getActivePost(db, postId);
  if (!post) throw notFound("Post not found");
  await db
    .update(posts)
    .set({ removedAt: new Date() })
    .where(eq(posts.id, postId));
}

/* ---------------------------------------------------------------- helpers -- */

interface FeedRow {
  id: string;
  courseId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: Date;
  savesCount: number;
  hasSaved: number;
}

function toPostDTO(r: FeedRow): PostDTO {
  return {
    id: r.id,
    courseId: r.courseId,
    authorId: r.authorId,
    authorName: r.authorName,
    body: r.body,
    createdAt: r.createdAt.toISOString(),
    hasSaved: Boolean(Number(r.hasSaved)),
    savesCount: Number(r.savesCount),
  };
}

/** Keyset predicate for a descending (ts, id) ordering. */
function keysetWhere(
  tsColumn: Parameters<typeof lt>[0],
  idColumn: Parameters<typeof lt>[0],
  cur: Cursor | null,
) {
  if (!cur) return undefined;
  const boundary = new Date(cur.ts);
  return or(
    lt(tsColumn, boundary),
    and(eq(tsColumn, boundary), lt(idColumn, cur.id)),
  );
}

/** Turn a `limit + 1` result set into a page with a next cursor. */
function paginate<Row, T>(
  rows: Row[],
  limit: number,
  project: (row: Row) => { dto: T; ts: number; id: string },
): Page<T> {
  const projected = rows.map(project);
  const hasMore = projected.length > limit;
  const page = hasMore ? projected.slice(0, limit) : projected;
  const last = page[page.length - 1];
  return {
    items: page.map((p) => p.dto),
    nextCursor: hasMore && last ? encodeCursor(last.ts, last.id) : null,
  };
}
