import type { NextRequest } from "next/server";
import { db } from "@/db/client";
import { savedQuerySchema } from "@/lib/schemas";
import { requireAuth } from "@/server/auth";
import { handle, json } from "@/server/http";
import { getSavedList } from "@/server/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/saved?cursor=&limit=
 * The caller's OWN saved posts, most-recently-saved first, paginated. There is
 * deliberately no userId parameter — the list is always the authenticated
 * caller's, which structurally enforces the "own list only" rule.
 */
export const GET = handle(async (req: NextRequest) => {
  const ctx = requireAuth(req.headers);
  const { searchParams } = new URL(req.url);
  const input = savedQuerySchema.parse({
    cursor: searchParams.get("cursor") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });
  const savedPage = await getSavedList(db, ctx, input);
  return json(savedPage);
});
