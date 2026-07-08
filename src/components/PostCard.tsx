"use client";

import { useI18n } from "@/i18n/context";
import type { PostDTO } from "@/lib/schemas";
import { BookmarkToggle } from "./BookmarkToggle";
import { SavesCountLabel } from "./SavesCountLabel";

interface Props {
  post: PostDTO;

  courseTitle?: string;
  onToggle: () => void;
  togglePending: boolean;
}

export function PostCard({ post, courseTitle, onToggle, togglePending }: Props) {
  const { t, formatDate } = useI18n();

  return (
    <article className="card">
      <div className="card__body">
        <div className="card__meta">
          {courseTitle ? <span className="card__course">{courseTitle}</span> : null}
          <span>{t("post.by", { author: post.authorName })}</span>
          <span>· {formatDate(post.createdAt)}</span>
        </div>
        <p className="card__text">{post.body}</p>
        <div className="card__footer">
          <SavesCountLabel count={post.savesCount} />
        </div>
      </div>
      <BookmarkToggle
        saved={post.hasSaved}
        pending={togglePending}
        onToggle={onToggle}
      />
    </article>
  );
}
