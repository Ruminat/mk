import { useCallback, useMemo } from "react";
import type { TMoodEntry } from "@mooduck/contracts";
import { computeMoodStats, type MoodStats } from "./ComputeMoodStats";
import { computeStreak } from "./ComputeStreak";
import { RECENT_LIMIT } from "./Definitions";
import { useAddMoodEntry } from "./UseAddMoodEntry";
import { useMoodEntries } from "./UseMoodEntries";

const EMPTY: readonly TMoodEntry[] = [];

export interface DashboardViewModel {
  loading: boolean;
  loadError: boolean;
  reload: () => Promise<void>;
  entries: TMoodEntry[];
  recent: TMoodEntry[];
  stats: MoodStats;
  streak: number;
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
 */
export function useDashboardController({ onUnauthorized }: UseDashboardControllerParams): DashboardViewModel {
  const entriesQuery = useMoodEntries(onUnauthorized);
  const adder = useAddMoodEntry(onUnauthorized);

  const entries = entriesQuery.state.status === "ready" ? entriesQuery.state.entries : (EMPTY as TMoodEntry[]);

  const stats = useMemo(() => computeMoodStats(entries), [entries]);
  const streak = useMemo(() => computeStreak(entries), [entries]);
  const recent = useMemo(() => entries.slice(0, RECENT_LIMIT), [entries]);

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
    recent,
    stats,
    streak,
    saving: adder.pending,
    saveError: adder.error,
    submitCheckIn,
  };
}
