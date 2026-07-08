"use client";

import { useI18n } from "@/i18n/context";

interface Props {
  hasMore: boolean;
  loading: boolean;
  onClick: () => void;
}

export function LoadMore({ hasMore, loading, onClick }: Props) {
  const { t } = useI18n();
  if (!hasMore) return null;
  return (
    <button
      type="button"
      className="load-more"
      onClick={onClick}
      disabled={loading}
    >
      {t("common.loadMore")}
    </button>
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="list" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" />
      ))}
    </div>
  );
}
