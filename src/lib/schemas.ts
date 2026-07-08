import { z } from "zod";

export const postDtoSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  body: z.string(),
  createdAt: z.string(),
  hasSaved: z.boolean(),
  savesCount: z.number().int().nonnegative(),
});
export type PostDTO = z.infer<typeof postDtoSchema>;

export const savedPostDtoSchema = postDtoSchema.extend({
  savedAt: z.string(),
});
export type SavedPostDTO = z.infer<typeof savedPostDtoSchema>;

export const courseDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
});
export type CourseDTO = z.infer<typeof courseDtoSchema>;

export const saveFlagsSchema = z.object({
  postId: z.string(),
  hasSaved: z.boolean(),
  savesCount: z.number().int().nonnegative(),
});
export type SaveFlags = z.infer<typeof saveFlagsSchema>;

export const page = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ items: z.array(item), nextCursor: z.string().nullable() });

export const feedPageSchema = page(postDtoSchema);
export type FeedPage = z.infer<typeof feedPageSchema>;

export const savedPageSchema = page(savedPostDtoSchema);
export type SavedPage = z.infer<typeof savedPageSchema>;

export const coursesSchema = z.array(courseDtoSchema);

const limitParam = z.coerce.number().int().positive().max(50).optional();

export const feedQuerySchema = z.object({
  courseId: z.string().min(1, "courseId is required"),
  cursor: z.string().optional(),
  limit: limitParam,
});

export const savedQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: limitParam,
});
