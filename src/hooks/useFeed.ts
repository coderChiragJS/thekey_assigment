"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useCurrentUser } from "@/lib/current-user";
import { queryKeys } from "@/lib/query-keys";

export function useFeed(courseId: string | undefined) {
  const { auth } = useCurrentUser();
  return useInfiniteQuery({
    queryKey: queryKeys.feed(auth.userId, courseId ?? ""),
    queryFn: ({ pageParam }) =>
      api.getFeed(auth, { courseId: courseId!, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: Boolean(courseId),
  });
}
