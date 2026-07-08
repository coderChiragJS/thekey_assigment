"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useCurrentUser } from "@/lib/current-user";
import { queryKeys } from "@/lib/query-keys";

/** Courses the current user may see (drives the feed's course selector). */
export function useCourses() {
  const { auth } = useCurrentUser();
  return useQuery({
    queryKey: queryKeys.courses(auth.userId),
    queryFn: () => api.getCourses(auth),
  });
}
