import { useCallback, useState } from "react";

export interface UseCheckInFormResult {
  value: number | null;
  note: string;
  showHint: boolean;
  setValue: (value: number) => void;
  setNote: (note: string) => void;
  save: () => Promise<void>;
}

/**
 * Ephemeral state for the check-in composer. On a successful save it clears; on
 * failure it keeps the score and note so the person can retry (the error banner
 * is owned by the data layer via `saveError`).
 */
export function useCheckInForm(
  onSubmit: (value: number, comment: string) => Promise<boolean>,
): UseCheckInFormResult {
  const [value, setValueState] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [showHint, setShowHint] = useState(false);

  const setValue = useCallback((next: number) => {
    setValueState(next);
    setShowHint(false);
  }, []);

  const save = useCallback(async () => {
    if (value === null) {
      setShowHint(true);
      return;
    }
    const ok = await onSubmit(value, note);
    if (ok) {
      setValueState(null);
      setNote("");
      setShowHint(false);
    }
  }, [value, note, onSubmit]);

  return { value, note, showHint, setValue, setNote, save };
}
