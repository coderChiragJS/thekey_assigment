"use client";

import { useI18n } from "@/i18n/context";

interface Props {
  saved: boolean;
  pending: boolean;
  onToggle: () => void;
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="bookmark__icon"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/** Presentational save/un-save button. All behaviour comes in via props. */
export function BookmarkToggle({ saved, pending, onToggle }: Props) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      className={`bookmark${saved ? " bookmark--saved" : ""}`}
      onClick={onToggle}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? t("post.unsaveAria") : t("post.saveAria")}
    >
      <BookmarkIcon filled={saved} />
      {saved ? t("post.saved") : t("post.save")}
    </button>
  );
}
