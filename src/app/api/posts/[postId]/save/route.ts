import type { NextRequest } from "next/server";
import { db } from "@/db/client";
import { requireAuth } from "@/server/auth";
import { handle, json } from "@/server/http";
import { savePost, unsavePost } from "@/server/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ postId: string }> };

export const POST = handle(async (req: NextRequest, { params }: Params) => {
  const ctx = requireAuth(req.headers);
  const { postId } = await params;
  const flags = await savePost(db, ctx, postId);
  return json(flags);
});

export const DELETE = handle(async (req: NextRequest, { params }: Params) => {
  const ctx = requireAuth(req.headers);
  const { postId } = await params;
  const flags = await unsavePost(db, ctx, postId);
  return json(flags);
});
