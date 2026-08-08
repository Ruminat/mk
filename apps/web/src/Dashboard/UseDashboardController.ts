import { useCallback, useMemo } from "react";
import { LIST_MOOD_ENTRIES_MAX, type TMoodEntry } from "@mooduck/contracts";
import { computeMoodStats, type MoodStats } from "./ComputeMoodStats";
import { computeStreak } from "./ComputeStreak";
import { useAddMoodEntry } from "./UseAddMoodEntry";
import { useMoodEntries } from "./UseMoodEntries";

const EMPTY: readonly TMoodEntry[] = [];

export interface DashboardViewModel {
  loading: boolean;
  loadError: boolean;
  reload: () => Promise<void>;
  /** Everything loaded so far, newest first — the Recent list. */
  entries: TMoodEntry[];
  /** The newest 360 entries: what the tiles and the chart describe. */
  statWindow: TMoodEntry[];
  stats: MoodStats;
  streak: number;
  hasMore: boolean;
  loadingMore: boolean;
  loadMoreError: boolean;
  loadMore: () => void;
  saving: boolean;
  saveError: boolean;
  submitCheckIn: (value: number, comment: string) => Promise<boolean>;
}

interface UseDashboardControllerParams {
  onUnauthorized: () => void;
}

/**
 * Composes the two data hooks and the pure stat helpers into one flat view-model
 * for the page. A new entry is prepended locally on success (it's the newest, so
 * ordering holds) rather than refetching the whole window.
 *
 * The tiles and the chart read `statWindow`, not everything loaded: they mirror
 * the bot's `/stat`, which is defined over the newest 360 entries. Scrolling
 * further back in Recent must not quietly redefine "average mood".
 */
export function useDashboardController({ onUnauthorized }: UseDashboardControllerParams): DashboardViewModel {
  const entriesQuery = useMoodEntries(onUnauthorized);
  const adder = useAddMoodEntry(onUnauthorized);

  const ready = entriesQuery.state.status === "ready" ? entriesQuery.state : null;
  const entries = ready ? ready.entries : (EMPTY as TMoodEntry[]);

  const statWindow = useMemo(() => entries.slice(0, LIST_MOOD_ENTRIES_MAX), [entries]);
  const stats = useMemo(() => computeMoodStats(statWindow), [statWindow]);
  const streak = useMemo(() => computeStreak(statWindow), [statWindow]);

  const submitCheckIn = useCallback(
    async (value: number, comment: string): Promise<boolean> => {
      const entry = await adder.submit(value, comment);
      if (entry) {
        entriesQuery.prepend(entry);
        return true;
      }
      return false;
    },
    [adder, entriesQuery],
  );

  return {
    loading: entriesQuery.state.status === "loading",
    loadError: entriesQuery.state.status === "error",
    reload: entriesQuery.reload,
    entries,
    statWindow,
    stats,
    streak,
    hasMore: ready?.hasMore ?? false,
    loadingMore: entriesQuery.loadingMore,
    loadMoreError: entriesQuery.loadMoreError,
    loadMore: entriesQuery.loadMore,
    saving: adder.pending,
    saveError: adder.error,
    submitCheckIn,
  };
}
