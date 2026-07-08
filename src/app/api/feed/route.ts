import type { NextRequest } from "next/server";
import { db } from "@/db/client";
import { feedQuerySchema } from "@/lib/schemas";
import { requireAuth } from "@/server/auth";
import { handle, json } from "@/server/http";
import { getCourseFeed } from "@/server/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/feed?courseId=&cursor=&limit=
 * Paginated feed for a course, newest first, hydrated with hasSaved + savesCount.
 * 401 unauthenticated · 404 unknown course · 403 not enrolled.
 */
export const GET = handle(async (req: NextRequest) => {
  const ctx = requireAuth(req.headers);
  const { searchParams } = new URL(req.url);
  const input = feedQuerySchema.parse({
    courseId: searchParams.get("courseId") ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });
  const feedPage = await getCourseFeed(db, ctx, input);
  return json(feedPage);
});
