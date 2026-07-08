"use client";

import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useCurrentUser } from "@/lib/current-user";
import { queryKeys } from "@/lib/query-keys";
import type { FeedPage, SavedPage } from "@/lib/schemas";

interface ToggleVars {
  postId: string;

  currentlySaved: boolean;
}

function patchFeed(
  data: InfiniteData<FeedPage>,
  postId: string,
  nextSaved: boolean,
  delta: number,
): InfiniteData<FeedPage> {
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((p) =>
        p.id === postId
          ? { ...p, hasSaved: nextSaved, savesCount: Math.max(0, p.savesCount + delta) }
          : p,
      ),
    })),
  };
}

function removeFromSaved(
  data: InfiniteData<SavedPage>,
  postId: string,
): InfiniteData<SavedPage> {
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.filter((p) => p.id !== postId),
    })),
  };
}

export function useToggleSave() {
  const { auth } = useCurrentUser();
  const qc = useQueryClient();
  const feedRoot = queryKeys.feedRoot(auth.userId);
  const savedKey = queryKeys.saved(auth.userId);

  return useMutation({
    mutationFn: ({ postId, currentlySaved }: ToggleVars) =>
      currentlySaved ? api.unsavePost(auth, postId) : api.savePost(auth, postId),

    onMutate: async ({ postId, currentlySaved }) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: feedRoot }),
        qc.cancelQueries({ queryKey: savedKey }),
      ]);

      const prevFeeds = qc.getQueriesData<InfiniteData<FeedPage>>({ queryKey: feedRoot });
      const prevSaved = qc.getQueryData<InfiniteData<SavedPage>>(savedKey);

      const nextSaved = !currentlySaved;
      const delta = nextSaved ? 1 : -1;

      qc.setQueriesData<InfiniteData<FeedPage>>({ queryKey: feedRoot }, (data) =>
        data ? patchFeed(data, postId, nextSaved, delta) : data,
      );

      if (currentlySaved && prevSaved) {
        qc.setQueryData<InfiniteData<SavedPage>>(
          savedKey,
          removeFromSaved(prevSaved, postId),
        );
      }

      return { prevFeeds, prevSaved };
    },

    onError: (_err, _vars, ctx) => {
      ctx?.prevFeeds.forEach(([key, data]) => qc.setQueryData(key, data));
      if (ctx?.prevSaved) qc.setQueryData(savedKey, ctx.prevSaved);
    },

    onSettled: () => {
      void qc.invalidateQueries({ queryKey: feedRoot });
      void qc.invalidateQueries({ queryKey: savedKey });
    },
  });
}
