import { useCallback, useEffect, useState } from "react";
import type { TMoodEntry } from "@mooduck/contracts";
import { ApiError } from "@/Api/ApiClient";
import { moodApi } from "@/Api/MoodApi";

export type TEntriesState =
  | { status: "loading" }
  | { status: "ready"; entries: TMoodEntry[] }
  | { status: "error" };

export interface UseMoodEntriesResult {
  state: TEntriesState;
  reload: () => Promise<void>;
  prepend: (entry: TMoodEntry) => void;
}

/** Loads the mood window once, exposes a reload, and can prepend a fresh entry. */
export function useMoodEntries(onUnauthorized: () => void): UseMoodEntriesResult {
  const [state, setState] = useState<TEntriesState>({ status: "loading" });

  // Fetch without touching state up front, so the mount effect never sets state
  // synchronously (the initial state is already "loading").
  const load = useCallback(async () => {
    try {
      const entries = await moodApi.listEntries();
      setState({ status: "ready", entries });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onUnauthorized();
        return;
      }
      setState({ status: "error" });
    }
  }, [onUnauthorized]);

  // For an explicit retry, show the loading state again before refetching.
  const reload = useCallback(async () => {
    setState({ status: "loading" });
    await load();
  }, [load]);

  useEffect(() => {
    // Fetch on mount. `load` only sets state after the request resolves (i.e.
    // post-await), not synchronously — the rule can't see through the async
    // boundary, so this is a false positive for a data-fetching effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const prepend = useCallback((entry: TMoodEntry) => {
    setState((prev) =>
      prev.status === "ready" ? { status: "ready", entries: [entry, ...prev.entries] } : prev,
    );
  }, []);

  return { state, reload, prepend };
}
