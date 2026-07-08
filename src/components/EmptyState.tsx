interface Props {
  title: string;
  body?: string;
}

/** Presentational empty state used by the feed and saved views. */
export function EmptyState({ title, body }: Props) {
  return (
    <div className="empty">
      <p className="empty__title">{title}</p>
      {body ? <p className="empty__body">{body}</p> : null}
    </div>
  );
}
