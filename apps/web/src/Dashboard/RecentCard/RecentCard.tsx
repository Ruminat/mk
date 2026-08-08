import type { TLocale } from "@mooduck/core";
import type { TMoodEntry } from "@mooduck/contracts";
import type { TWebMessages } from "@/I18n/Catalogs/En";
import { formatRelativeTime } from "../FormatRelativeTime";
import { useLoadMoreOnScroll } from "./UseLoadMoreOnScroll";
import styles from "./RecentCard.module.css";

interface RecentCardProps {
  messages: TWebMessages;
  locale: TLocale;
  /** Everything loaded so far, newest first — all of it is shown. */
  entries: TMoodEntry[];
  loading: boolean;
  loadError: boolean;
  onRetry: () => void;
  hasMore: boolean;
  loadingMore: boolean;
  loadMoreError: boolean;
  onLoadMore: () => void;
}

export function RecentCard(props: RecentCardProps) {
  const { messages, loading, loadError, onRetry, entries } = props;

  return (
    <section className={styles.card}>
      <h3 className={styles.title}>{messages.recent.title}</h3>
      {loading ? (
        <p className={styles.muted}>{messages.states.loading}</p>
      ) : loadError ? (
        <div className={styles.errorBlock}>
          <p className={styles.muted}>{messages.states.loadError}</p>
          <button type="button" className={styles.retry} onClick={onRetry}>
            {messages.states.retry}
          </button>
        </div>
      ) : entries.length === 0 ? (
        <p className={styles.muted}>{messages.recent.empty}</p>
      ) : (
        <RecentList {...props} />
      )}
    </section>
  );
}

/**
 * Its own component so the scroll hook runs unconditionally — the card renders a
 * list only once it has entries, and hooks can't sit behind that branch.
 */
function RecentList({
  messages,
  locale,
  entries,
  hasMore,
  loadingMore,
  loadMoreError,
  onLoadMore,
}: RecentCardProps) {
  // Stop auto-loading while a page is in flight, and after one failed — the
  // sentinel stays on screen, so an unguarded retry would spin.
  const sentinelRef = useLoadMoreOnScroll(hasMore && !loadingMore && !loadMoreError, onLoadMore);

  return (
    <ul className={styles.list}>
      {entries.map((entry) => (
        <li key={entry.id} className={styles.row}>
          <span className={styles.badge}>{entry.value}</span>
          <span className={styles.note}>{entry.comment ?? ""}</span>
          <span className={styles.time}>{formatRelativeTime(entry.createdAt, locale)}</span>
        </li>
      ))}

      {hasMore ? (
        <li className={styles.more} ref={sentinelRef}>
          {loadMoreError ? (
            <button type="button" className={styles.retry} onClick={onLoadMore}>
              {messages.states.retry}
            </button>
          ) : (
            <span className={styles.muted}>{messages.states.loading}</span>
          )}
        </li>
      ) : null}
    </ul>
  );
}
