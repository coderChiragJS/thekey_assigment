"use client";

import { useI18n } from "@/i18n/context";

/** Renders the pluralized saves count ("1 save" / "12 saves"), locale-aware. */
export function SavesCountLabel({ count }: { count: number }) {
  const { tCount } = useI18n();
  return <span>{tCount("post.savesCount", count)}</span>;
}
