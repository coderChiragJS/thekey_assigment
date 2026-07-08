import type { PluralForms } from "@/domain/plural";

/** English message catalog. Every user-facing string lives here (never inline). */
export const enMessages = {
  "app.title": "Community Forum",
  "app.tagline": "Course discussions & saved posts",

  "nav.feed": "Feed",
  "nav.saved": "Saved",

  "toolbar.viewingAs": "Viewing as",
  "toolbar.language": "Language",
  "role.student": "student",
  "role.moderator": "moderator",

  "feed.heading": "Feed",
  "feed.course": "Course",
  "feed.loading": "Loading posts…",
  "feed.empty": "No posts in this course yet.",
  "feed.error": "Couldn't load the feed.",
  "feed.forbidden": "You're not enrolled in this course.",
  "feed.noCourses": "You're not enrolled in any courses yet.",

  "saved.heading": "Saved Posts",
  "saved.loading": "Loading your saved posts…",
  "saved.error": "Couldn't load your saved posts.",
  "saved.empty.title": "Nothing saved yet",
  "saved.empty.body": "Bookmark a post from the feed and it'll show up here.",

  "post.by": "by {author}",
  "post.save": "Save",
  "post.saved": "Saved",
  "post.saveAria": "Save this post",
  "post.unsaveAria": "Remove from saved",

  "common.loadMore": "Load more",
  "common.retry": "Try again",
} as const;

/** Plural forms, resolved with Intl.PluralRules (e.g. "1 save" / "12 saves"). */
export const enPlurals: Record<string, PluralForms> = {
  "post.savesCount": { one: "{count} save", other: "{count} saves" },
};
