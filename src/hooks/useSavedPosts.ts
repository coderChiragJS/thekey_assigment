"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useCurrentUser } from "@/lib/current-user";
import { queryKeys } from "@/lib/query-keys";

export function useSavedPosts() {
  const { auth } = useCurrentUser();
  return useInfiniteQuery({
    queryKey: queryKeys.saved(auth.userId),
    queryFn: ({ pageParam }) => api.getSaved(auth, { cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}
