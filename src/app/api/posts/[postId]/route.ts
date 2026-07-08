import type { NextRequest } from "next/server";
import { db } from "@/db/client";
import { requireAuth } from "@/server/auth";
import { handle, json } from "@/server/http";
import { removePost } from "@/server/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ postId: string }> };

/**
 * DELETE /api/posts/:postId — moderator-only post removal (soft delete).
 * 401 · 403 (students) · 404 (no post). Demonstrates the role boundary.
 */
export const DELETE = handle(async (req: NextRequest, { params }: Params) => {
  const ctx = requireAuth(req.headers);
  const { postId } = await params;
  await removePost(db, ctx, postId);
  return json({ ok: true });
});
