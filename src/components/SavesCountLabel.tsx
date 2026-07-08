"use client";

import { useI18n } from "@/i18n/context";

export function SavesCountLabel({ count }: { count: number }) {
  const { tCount } = useI18n();
  return <span>{tCount("post.savesCount", count)}</span>;
}
