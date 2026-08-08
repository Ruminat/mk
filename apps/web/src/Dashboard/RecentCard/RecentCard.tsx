import type { TLocale } from "@mooduck/core";
import type { TMoodEntry } from "@mooduck/contracts";
import type { TWebMessages } from "@/I18n/Catalogs/En";
import { formatRelativeTime } from "../FormatRelativeTime";
import styles from "./RecentCard.module.css";

interface RecentCardProps {
  messages: TWebMessages;
  locale: TLocale;
  entries: TMoodEntry[];
  loading: boolean;
  loadError: boolean;
  onRetry: () => void;
}

export function RecentCard({ messages, locale, entries, loading, loadError, onRetry }: RecentCardProps) {
  return (
    <section className={styles.card}>
      <h3 className={styles.title}>{messages.recent.title}</h3>
      {renderBody({ messages, locale, entries, loading, loadError, onRetry })}
    </section>
  );
}

function renderBody({ messages, locale, entries, loading, loadError, onRetry }: RecentCardProps) {
  if (loading) {
    return <p className={styles.muted}>{messages.states.loading}</p>;
  }
  if (loadError) {
    return (
      <div className={styles.errorBlock}>
        <p className={styles.muted}>{messages.states.loadError}</p>
        <button type="button" className={styles.retry} onClick={onRetry}>
          {messages.states.retry}
        </button>
      </div>
    );
  }
  if (entries.length === 0) {
    return <p className={styles.muted}>{messages.recent.empty}</p>;
  }
  return (
    <ul className={styles.list}>
      {entries.map((entry) => (
        <li key={entry.id} className={styles.row}>
          <span className={styles.badge}>{entry.value}</span>
          <span className={styles.note}>{entry.comment ?? ""}</span>
          <span className={styles.time}>{formatRelativeTime(entry.createdAt, locale)}</span>
        </li>
      ))}
    </ul>
  );
}
