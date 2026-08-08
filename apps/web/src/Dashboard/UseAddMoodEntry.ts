import { useCallback, useState } from "react";
import type { TCreateMoodEntry, TMoodEntry } from "@mooduck/contracts";
import { ApiError } from "@/Api/ApiClient";
import { moodApi } from "@/Api/MoodApi";

export interface UseAddMoodEntryResult {
  pending: boolean;
  error: boolean;
  submit: (value: number, comment: string) => Promise<TMoodEntry | null>;
  clearError: () => void;
}

/** Owns the save-in-flight and save-failed state for a check-in. */
export function useAddMoodEntry(onUnauthorized: () => void): UseAddMoodEntryResult {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  const submit = useCallback(
    async (value: number, comment: string): Promise<TMoodEntry | null> => {
      setPending(true);
      setError(false);
      try {
        const trimmed = comment.trim();
        const input: TCreateMoodEntry = trimmed ? { value, comment: trimmed } : { value };
        return await moodApi.addEntry(input);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          onUnauthorized();
          return null;
        }
        setError(true);
        return null;
      } finally {
        setPending(false);
      }
    },
    [onUnauthorized],
  );

  const clearError = useCallback(() => setError(false), []);

  return { pending, error, submit, clearError };
}
