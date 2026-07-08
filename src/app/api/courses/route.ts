import type { NextRequest } from "next/server";
import { db } from "@/db/client";
import { requireAuth } from "@/server/auth";
import { handle, json } from "@/server/http";
import { listVisibleCourses } from "@/server/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest) => {
  const ctx = requireAuth(req.headers);
  const courses = await listVisibleCourses(db, ctx);
  return json(courses);
});
