import type { TWebMessages } from "@/I18n/Catalogs/En";
import styles from "./StatTiles.module.css";

interface StatTilesProps {
  messages: TWebMessages;
  average: number | null;
  count: number;
  streak: number;
  hasEntries: boolean;
  loading: boolean;
}

export function StatTiles({ messages, average, count, streak, hasEntries, loading }: StatTilesProps) {
  const m = messages.stats;

  const averageText = loading ? "…" : average === null ? m.empty : average.toFixed(1);
  const countText = loading ? "…" : String(count);
  const streakText = loading ? "…" : hasEntries ? m.streakValue(streak) : m.empty;

  return (
    <div className={styles.grid}>
      <Tile label={m.averageMood} value={averageText} />
      <Tile label={m.checkIns} value={countText} />
      <Tile label={m.streak} value={streakText} />
    </div>
  );
}

interface TileProps {
  label: string;
  value: string;
}

function Tile({ label, value }: TileProps) {
  return (
    <div className={styles.tile}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
    </div>
  );
}
