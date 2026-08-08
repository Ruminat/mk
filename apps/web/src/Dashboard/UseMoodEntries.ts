import { useCallback, useEffect, useRef, useState } from "react";
import { LIST_MOOD_ENTRIES_MAX, type TMoodEntry } from "@mooduck/contracts";
import { ApiError } from "@/Api/ApiClient";
import { moodApi } from "@/Api/MoodApi";
import { appendOlderEntries } from "./AppendOlderEntries";

/** One page of history. The first page is also the window the stats describe. */
const PAGE_SIZE = LIST_MOOD_ENTRIES_MAX;

export type TEntriesState =
  | { status: "loading" }
  | { status: "ready"; entries: TMoodEntry[]; hasMore: boolean }
  | { status: "error" };

export interface UseMoodEntriesResult {
  state: TEntriesState;
  reload: () => Promise<void>;
  prepend: (entry: TMoodEntry) => void;
  /** Fetch the next older page. Ignored while one is already in flight. */
  loadMore: () => void;
  loadingMore: boolean;
  /** The last "load older" failed; auto-loading stops until `loadMore` is called again. */
  loadMoreError: boolean;
}

/** Loads the newest page, exposes a reload, and pages further back on demand. */
export function useMoodEntries(onUnauthorized: () => void): UseMoodEntriesResult {
  const [state, setState] = useState<TEntriesState>({ status: "loading" });
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);

  // How many rows the server has handed us, which is what the next offset must
  // be. Not `entries.length`: a locally prepended check-in isn't a fetched row,
  // and counting it would skip an entry. A ref, so `loadMore` stays stable and
  // can't fire twice off a stale value.
  const fetchedCount = useRef(0);
  const inFlight = useRef(false);

  // Fetch without touching state up front, so the mount effect never sets state
  // synchronously (the initial state is already "loading").
  const load = useCallback(async () => {
    try {
      const entries = await moodApi.listEntries({ limit: PAGE_SIZE });
      fetchedCount.current = entries.length;
      setState({ status: "ready", entries, hasMore: entries.length === PAGE_SIZE });
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
    setLoadMoreError(false);
    await load();
  }, [load]);

  useEffect(() => {
    // Fetch on mount. `load` only sets state after the request resolves (i.e.
    // post-await), not synchronously — the rule can't see through the async
    // boundary, so this is a false positive for a data-fetching effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const loadMore = useCallback(() => {
    if (inFlight.current) {
      return;
    }
    inFlight.current = true;
    setLoadingMore(true);
    setLoadMoreError(false);

    void (async () => {
      try {
        const older = await moodApi.listEntries({ limit: PAGE_SIZE, offset: fetchedCount.current });
        fetchedCount.current += older.length;
        setState((prev) =>
          prev.status === "ready"
            ? {
                status: "ready",
                entries: appendOlderEntries(prev.entries, older),
                // Judged on the raw page, not the merged list: a full page means
                // there is probably more behind it even if every row was a dupe.
                hasMore: older.length === PAGE_SIZE,
              }
            : prev,
        );
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          onUnauthorized();
          return;
        }
        // Keep the rows we have and stop auto-loading, so a failing request
        // can't be retried in a loop every time the sentinel is on screen.
        setLoadMoreError(true);
      } finally {
        inFlight.current = false;
        setLoadingMore(false);
      }
    })();
  }, [onUnauthorized]);

  const prepend = useCallback((entry: TMoodEntry) => {
    setState((prev) =>
      prev.status === "ready" ? { ...prev, entries: [entry, ...prev.entries] } : prev,
    );
  }, []);

  return { state, reload, prepend, loadMore, loadingMore, loadMoreError };
}
