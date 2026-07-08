export const queryKeys = {
  courses: (userId: string) => ["courses", userId] as const,

  feedRoot: (userId: string) => ["feed", userId] as const,
  feed: (userId: string, courseId: string) =>
    ["feed", userId, courseId] as const,

  saved: (userId: string) => ["saved", userId] as const,
};
