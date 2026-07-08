"use client";

import { useMemo } from "react";
import { EmptyState } from "@/components/EmptyState";
import { ListSkeleton, LoadMore } from "@/components/LoadMore";
import { PostCard } from "@/components/PostCard";
import { useCourses } from "@/hooks/useCourses";
import { useSavedPosts } from "@/hooks/useSavedPosts";
import { useToggleSave } from "@/hooks/useToggleSave";
import { useI18n } from "@/i18n/context";

export default function SavedPage() {
  const { t } = useI18n();
  const saved = useSavedPosts();
  const coursesQuery = useCourses();
  const toggle = useToggleSave();

  const courseTitles = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of coursesQuery.data ?? []) map.set(c.id, c.title);
    return map;
  }, [coursesQuery.data]);

  const posts = saved.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div>
      <h1 className="page-title">{t("saved.heading")}</h1>

      {saved.isPending ? (
        <ListSkeleton />
      ) : saved.isError ? (
        <div className="state error">{t("saved.error")}</div>
      ) : posts.length === 0 ? (
        <EmptyState
          title={t("saved.empty.title")}
          body={t("saved.empty.body")}
        />
      ) : (
        <div className="list">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              courseTitle={courseTitles.get(post.courseId)}
              onToggle={() =>
                toggle.mutate({ postId: post.id, currentlySaved: post.hasSaved })
              }
              togglePending={
                toggle.isPending && toggle.variables?.postId === post.id
              }
            />
          ))}
          <LoadMore
            hasMore={Boolean(saved.hasNextPage)}
            loading={saved.isFetchingNextPage}
            onClick={() => saved.fetchNextPage()}
          />
        </div>
      )}
    </div>
  );
}
