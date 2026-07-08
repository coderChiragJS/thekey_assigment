import type { z } from "zod";
import type { Auth } from "./demo-users";
import {
  coursesSchema,
  feedPageSchema,
  savedPageSchema,
  saveFlagsSchema,
  type CourseDTO,
  type FeedPage,
  type SaveFlags,
  type SavedPage,
} from "./schemas";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function authHeaders(auth: Auth): Record<string, string> {
  return { "x-user-id": auth.userId, "x-role": auth.role };
}

async function request<T>(
  path: string,
  auth: Auth,
  schema: z.ZodType<T>,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { ...authHeaders(auth), ...(init.headers ?? {}) },
  });

  if (!res.ok) {
    let code = "ERROR";
    let message = res.statusText;
    try {
      const body = (await res.json()) as {
        error?: { code?: string; message?: string };
      };
      code = body.error?.code ?? code;
      message = body.error?.message ?? message;
    } catch {
    }
    throw new ApiError(res.status, code, message);
  }

  return schema.parse(await res.json());
}

function query(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") sp.set(key, String(value));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const api = {
  getCourses: (auth: Auth): Promise<CourseDTO[]> =>
    request("/api/courses", auth, coursesSchema),

  getFeed: (
    auth: Auth,
    input: { courseId: string; cursor?: string; limit?: number },
  ): Promise<FeedPage> =>
    request(
      `/api/feed${query({ courseId: input.courseId, cursor: input.cursor, limit: input.limit })}`,
      auth,
      feedPageSchema,
    ),

  getSaved: (
    auth: Auth,
    input: { cursor?: string; limit?: number } = {},
  ): Promise<SavedPage> =>
    request(
      `/api/saved${query({ cursor: input.cursor, limit: input.limit })}`,
      auth,
      savedPageSchema,
    ),

  savePost: (auth: Auth, postId: string): Promise<SaveFlags> =>
    request(`/api/posts/${encodeURIComponent(postId)}/save`, auth, saveFlagsSchema, {
      method: "POST",
    }),

  unsavePost: (auth: Auth, postId: string): Promise<SaveFlags> =>
    request(`/api/posts/${encodeURIComponent(postId)}/save`, auth, saveFlagsSchema, {
      method: "DELETE",
    }),
};
