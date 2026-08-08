import type { TMoodEntry } from "@mooduck/contracts";

export interface MoodStats {
  /** Arithmetic mean of every entry's value, rounded to one decimal; null when empty. */
  average: number | null;
  count: number;
}

/**
 * Same definition as the bot's `getMoodStats` over the same 360-entry window, so
 * the tile and `/stat` agree by construction: average is `sum / n`, count is `n`.
 */
export function computeMoodStats(entries: readonly TMoodEntry[]): MoodStats {
  const count = entries.length;
  if (count === 0) {
    return { average: null, count: 0 };
  }
  const sum = entries.reduce((total, entry) => total + entry.value, 0);
  return { average: Math.round((sum / count) * 10) / 10, count };
}
