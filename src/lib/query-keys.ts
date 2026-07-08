/**
 * Central query-key factory. Every key is scoped by userId so switching the
 * current user never serves another user's cached data. Keeping the keys in one
 * place makes targeted invalidation after a mutation unambiguous.
 */
export const queryKeys = {
  courses: (userId: string) => ["courses", userId] as const,

  feedRoot: (userId: string) => ["feed", userId] as const,
  feed: (userId: string, courseId: string) =>
    ["feed", userId, courseId] as const,

  saved: (userId: string) => ["saved", userId] as const,
};
