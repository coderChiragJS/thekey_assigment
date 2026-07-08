"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { ListSkeleton, LoadMore } from "@/components/LoadMore";
import { PostCard } from "@/components/PostCard";
import { useCourses } from "@/hooks/useCourses";
import { useFeed } from "@/hooks/useFeed";
import { useToggleSave } from "@/hooks/useToggleSave";
import { useI18n } from "@/i18n/context";
import { ApiError } from "@/lib/api-client";

export default function FeedPage() {
  const { t } = useI18n();
  const coursesQuery = useCourses();
  const [courseId, setCourseId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!courseId && coursesQuery.data?.length) {
      setCourseId(coursesQuery.data[0]!.id);
    }
  }, [courseId, coursesQuery.data]);

  const feed = useFeed(courseId);
  const toggle = useToggleSave();
  const posts = feed.data?.pages.flatMap((p) => p.items) ?? [];

  const forbidden = feed.error instanceof ApiError && feed.error.status === 403;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t("feed.heading")}</h1>
      </div>

      {coursesQuery.data && coursesQuery.data.length > 0 ? (
        <label className="control" style={{ marginBottom: 16 }}>
          {t("feed.course")}
          <select
            className="select"
            value={courseId ?? ""}
            onChange={(e) => setCourseId(e.target.value)}
            aria-label={t("feed.course")}
          >
            {coursesQuery.data.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {coursesQuery.isSuccess && coursesQuery.data.length === 0 ? (
        <EmptyState title={t("feed.noCourses")} />
      ) : feed.isPending && courseId ? (
        <ListSkeleton />
      ) : forbidden ? (
        <div className="state error">{t("feed.forbidden")}</div>
      ) : feed.isError ? (
        <div className="state error">{t("feed.error")}</div>
      ) : posts.length === 0 && courseId ? (
        <EmptyState title={t("feed.empty")} />
      ) : (
        <div className="list">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onToggle={() =>
                toggle.mutate({ postId: post.id, currentlySaved: post.hasSaved })
              }
              togglePending={
                toggle.isPending && toggle.variables?.postId === post.id
              }
            />
          ))}
          <LoadMore
            hasMore={Boolean(feed.hasNextPage)}
            loading={feed.isFetchingNextPage}
            onClick={() => feed.fetchNextPage()}
          />
        </div>
      )}
    </div>
  );
}
