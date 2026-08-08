import { type KeyboardEvent, useRef } from "react";
import { MOOD_SCORES } from "../Definitions";
import styles from "./MoodScorePicker.module.css";

interface MoodScorePickerProps {
  value: number | null;
  onChange: (value: number) => void;
  groupLabel: string;
  scoreLabel: (score: number) => string;
}

/**
 * The 1–10 scale as a real `radiogroup`: roving tabindex (one stop in the tab
 * order), arrow keys move and select, `aria-checked` reflects the choice.
 */
export function MoodScorePicker({ value, onChange, groupLabel, scoreLabel }: MoodScorePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // The selected radio is the tab stop; with nothing selected yet, the first is.
  const tabbable = value ?? MOOD_SCORES[0];

  const focusScore = (score: number): void => {
    containerRef.current?.querySelector<HTMLButtonElement>(`[data-score="${score}"]`)?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, score: number): void => {
    let next: number | null = null;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = score >= 10 ? 1 : score + 1;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = score <= 1 ? 10 : score - 1;
        break;
      case "Home":
        next = 1;
        break;
      case "End":
        next = 10;
        break;
      default:
        return;
    }
    event.preventDefault();
    onChange(next);
    focusScore(next);
  };

  return (
    <div ref={containerRef} className={styles.group} role="radiogroup" aria-label={groupLabel}>
      {MOOD_SCORES.map((score) => {
        const checked = value === score;
        return (
          <button
            key={score}
            type="button"
            role="radio"
            data-score={score}
            data-checked={checked}
            aria-checked={checked}
            aria-label={scoreLabel(score)}
            tabIndex={score === tabbable ? 0 : -1}
            className={styles.score}
            onClick={() => onChange(score)}
            onKeyDown={(event) => handleKeyDown(event, score)}
          >
            {score}
          </button>
        );
      })}
    </div>
  );
}
